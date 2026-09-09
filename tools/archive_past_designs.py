"""Restore historical portfolio designs into isolated, namespaced static replays."""

import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / '.worktrees/past-designs'
EVIDENCE = ROOT / 'artifacts/past-designs-2026-09-09'
CATALOG = json.loads((ROOT / 'tools/past-designs.json').read_text())
PUBLIC = ROOT / 'public/past-designs'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def copy_tree(source, target, snapshots=False):
    for path in source.rglob('*'):
        if not path.is_file() or any(p.startswith('._') for p in path.parts):
            continue
        relative = str(path.relative_to(source))
        if snapshots and relative.endswith('.snapshot'):
            relative = relative[:-9]
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, destination)


def unpack(data, target, source_only=False):
    with tarfile.open(fileobj=io.BytesIO(data)) as archive:
        for member in archive:
            relative = Path(member.name)
            if (not member.isfile() or relative.is_absolute() or '..' in relative.parts
                    or any(p.startswith('._') for p in relative.parts)):
                continue
            if source_only and relative.parts[0] not in ('src', 'public'):
                continue
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(archive.extractfile(member).read())


def git_source(ref, target):
    names = subprocess.check_output(['git', 'ls-tree', '--name-only', ref], cwd=ROOT).decode().splitlines()
    paths = [p for p in ['src', 'public', 'package.json', 'package-lock.json', 'astro.config.mjs', 'tsconfig.json'] if p in names]
    unpack(subprocess.check_output(['git', 'archive', ref, *paths], cwd=ROOT), target)


def overlay_archive(relative, target):
    unpack((ROOT / relative).read_bytes(), target, source_only=True)


def prepare(item):
    target = WORK / item['id']
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True)
    recipe = item['recipe']
    if recipe == 'git':
        git_source(item['ref'], target)
    else:
        # A complete shared source baseline, followed by the captured revision.
        copy_tree(ROOT / 'artifacts/kinetic-2026-09-08/before', target)
        copy_tree(ROOT / 'src/assets', target / 'src/assets')
        for name in ['cv.pdf', 'favicon.svg', 'og.png', 'portrait.jpg']:
            if (ROOT / 'public' / name).exists():
                shutil.copy2(ROOT / 'public' / name, target / 'public' / name)
        if recipe == 'editorial':
            shutil.rmtree(target / 'src')
            overlay_archive('artifacts/rebuild-2026-09-05/first-draft-source.tar.gz', target)
        elif recipe == 'dark':
            copy_tree(ROOT / 'artifacts/gallery-2026-09-07/before', target, snapshots=True)
        elif recipe in ('archive', 'kinetic'):
            shutil.rmtree(target / 'src')
            overlay_archive('artifacts/nature-2026-09-09/before.tgz', target)
            if recipe == 'kinetic':
                copy_tree(ROOT / 'artifacts/archive-2026-09-08/before', target)
        elif recipe in ('lake', 'journey'):
            shutil.rmtree(target / 'src')
            overlay_archive('artifacts/journey-2026-09-09/before.tgz', target)
            if recipe == 'journey':
                overlay_archive('artifacts/lanting-2026-09-09/inherited-nature-source.tgz', target)
                overlay_archive('artifacts/lanting-2026-09-09/before.tgz', target)
    # Independent apps remain the current separately maintained destinations.
    for name in ['medit', 'singularity']:
        path = target / 'public' / name
        if path.exists():
            shutil.rmtree(path)
    for name in ['CNAME', 'robots.txt', 'sitemap.xml', 'sitemap-index.xml']:
        (target / 'public' / name).unlink(missing_ok=True)
    runtime = WORK / (item['runtime'] + '-runtime') / 'node_modules'
    if not runtime.exists():
        raise RuntimeError(f'Missing isolated build dependencies: {runtime}')
    (target / 'node_modules').symlink_to(runtime, target_is_directory=True)
    # Only the static output location and URL namespace differ from the source.
    # Root-relative source links are relocated in the exported artifacts below.
    (target / 'astro.config.mjs').write_text(
        "import { defineConfig } from 'astro/config';\n"
        "export default defineConfig({site:'https://zibinzhao.com',"
        "build:{format:'directory'}});\n")
    return target


def relocate(text, prefix, roots):
    # Rewrite known local roots only. Do not alter external/protocol-relative URLs,
    # arbitrary regexes, data URLs, SVG paths, or the separately hosted apps.
    for root in sorted(roots, key=len, reverse=True):
        text = text.replace('/' + root, prefix + root) if root == '_astro/' else re.sub(
            r'(?<=[\"\'`(=])/' + re.escape(root) + r'(?=[/\"\'`?#)\s]|$)',
            lambda _: prefix + root, text)
    text = re.sub(r'((?:href|action)=[\"\'])/([\"\'])', lambda m: m[1] + prefix + m[2], text)
    return text


def export(item, target):
    built = target / 'dist'
    output = PUBLIC / item['id']
    if output.exists():
        shutil.rmtree(output)
    shutil.copytree(built, output)
    prefix = f"/past-designs/{item['id']}/"
    roots = {p.name + ('/' if p.is_dir() and p.name == '_astro' else '') for p in built.iterdir()}
    roots.discard('index.html')
    for path in output.rglob('*'):
        if path.suffix not in ('.html', '.css', '.js', '.svg', '.json', '.txt'):
            continue
        original = path.read_text()
        text = relocate(original, prefix, roots)
        if path.suffix == '.html':
            def explicit_index(match):
                url = match[2]
                pathname = re.split(r'[?#]', url, maxsplit=1)[0]
                local = pathname.removeprefix(prefix)
                if pathname.endswith('/') and (output / local / 'index.html').exists():
                    url = pathname + 'index.html' + url[len(pathname):]
                return match[1] + url + match[3]
            text = re.sub(r'(href=[\"\'])(' + re.escape(prefix) + r'[^\"\']*)([\"\'])', explicit_index, text)
            text = re.sub(r'<link\b[^>]*\brel=[\"\'](?:canonical|alternate)[\"\'][^>]*>', '', text)
            text = text.replace('</head>', '<meta name="robots" content="noindex,follow"><style>html[data-archive-embedded] [data-archive-return]{display:none!important}</style><script>if(window.self!==window.top)document.documentElement.dataset.archiveEmbedded="true";</script></head>')
            # One unobtrusive exit survives standalone viewing and inner-page links.
            chinese = path.relative_to(output).parts[0] == 'zh'
            label = '回到往昔' if chinese else 'Back to past designs'
            parent = ('/zh' if chinese else '') + f'/past/{item["id"]}/'
            exit_link = f'<a href="{parent}" target="_top" data-archive-return style="position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#eee5d3;color:#302a22;padding:10px 14px;border:1px solid #8a7861;border-radius:30px;font:12px/1.4 system-ui;text-decoration:none">← {label}</a>'
            text = text.replace('</body>', exit_link + '</body>')
        path.write_text(text)
    result = {
        'id': item['id'], 'recipe': item['recipe'], 'ref': item.get('ref'),
        'entry': prefix + 'index.html', 'hasChineseRoutes': (output / 'zh/index.html').exists(),
        'files': {str(p.relative_to(output)): sha(p) for p in sorted(output.rglob('*')) if p.is_file()},
        'sourceFiles': {str(p.relative_to(target)): sha(p) for p in sorted((target / 'src').rglob('*')) if p.is_file()},
        'adjustments': ['Namespaced static URLs', 'Noindex metadata', 'Persistent archive return link', 'Shared apps excluded', 'Offline historical GitHub fallback where supported'],
    }
    (EVIDENCE / f'{item["id"]}-export.json').write_text(json.dumps(result, indent=2) + '\n')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--only', help='Comma-separated catalog IDs')
    parser.add_argument('--prepare-only', action='store_true')
    parser.add_argument('--export-only', action='store_true')
    args = parser.parse_args()
    chosen = set(args.only.split(',')) if args.only else {x['id'] for x in CATALOG}
    if not chosen.issubset({x['id'] for x in CATALOG}):
        raise ValueError('Unknown design ID')
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    env = {**os.environ, 'GITHUB_PROJECTS_OFFLINE': '1', 'ASTRO_TELEMETRY_DISABLED': '1'}
    for item in CATALOG:
        if item['id'] not in chosen:
            continue
        target = WORK / item['id'] if args.export_only else prepare(item)
        if args.prepare_only:
            print(item['id'], 'prepared', flush=True)
            continue
        if not args.export_only:
            with (EVIDENCE / f'{item["id"]}-build.log').open('w') as log:
                package = json.loads((target / 'node_modules/astro/package.json').read_text())
                cli = target / 'node_modules/astro' / package['bin']['astro']
                result = subprocess.run(['node', str(cli), 'build'], cwd=target, env=env, stdout=log, stderr=subprocess.STDOUT)
            if result.returncode:
                raise RuntimeError(f'{item["id"]} build failed; inspect its retained log')
        result = export(item, target)
        print(item['id'], 'exported', len(result['files']), 'files', flush=True)


if __name__ == '__main__':
    main()
