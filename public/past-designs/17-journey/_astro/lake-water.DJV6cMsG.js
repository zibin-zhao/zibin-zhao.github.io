async function e(e,t,n){let r=t.closest(`[data-lake-surface]`),i=r.querySelector(`[data-lake-canvas]`),a=t=>{e.dataset.waterState=t,r.dataset.waterState=t},o=i.getContext(`webgl2`,{alpha:!1,antialias:!1,depth:!1,powerPreference:`low-power`});if(!o){a(`fallback`);return}let s=(e,t)=>{let n=o.createShader(e);if(o.shaderSource(n,t),o.compileShader(n),!o.getShaderParameter(n,o.COMPILE_STATUS))throw o.deleteShader(n),Error(`Water shader could not compile`);return n},c=s(o.VERTEX_SHADER,`#version 300 es
    in vec2 aPosition;
    out vec2 vUv;
    void main() { vUv = aPosition * .5 + .5; gl_Position = vec4(aPosition, 0., 1.); }
  `),l=s(o.FRAGMENT_SHADER,`#version 300 es
    precision highp float;
    uniform sampler2D uPhoto;
    uniform vec2 uSize;
    uniform float uImageAspect;
    uniform float uTime;
    uniform vec4 uRipples[6];
    in vec2 vUv;
    out vec4 color;
    void main() {
      float aspect = uSize.x / uSize.y;
      vec2 fit = vec2(min(aspect / uImageAspect, 1.), min(uImageAspect / aspect, 1.));
      vec2 uv = (vUv - .5) * fit + .5;
      float water = 1. - smoothstep(.32, .405, uv.y);
      vec2 displacement = vec2(sin(uv.y * 190. + uTime * .55) * .0008, sin(uv.x * 110. + uv.y * 70. + uTime * .35) * .00025);
      for (int i = 0; i < 6; i++) {
        float age = uTime - uRipples[i].z;
        vec2 delta = (vUv - uRipples[i].xy) * vec2(aspect, 1.);
        float distanceToRing = length(delta);
        float ring = distanceToRing - age * .065;
        float envelope = exp(-abs(ring) * 45.) * exp(-age * .72) * step(0., age) * uRipples[i].w;
        displacement += normalize(delta + .00001) * sin(ring * 125.) * envelope * .007;
      }
      color = texture(uPhoto, clamp(uv + displacement * water, .001, .999));
    }
  `),u=o.createProgram();if(o.attachShader(u,c),o.attachShader(u,l),o.linkProgram(u),o.deleteShader(c),o.deleteShader(l),!o.getProgramParameter(u,o.LINK_STATUS))throw o.deleteProgram(u),Error(`Water shader could not link`);o.useProgram(u);let d=o.createBuffer();o.bindBuffer(o.ARRAY_BUFFER,d),o.bufferData(o.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),o.STATIC_DRAW);let f=o.getAttribLocation(u,`aPosition`);o.enableVertexAttribArray(f),o.vertexAttribPointer(f,2,o.FLOAT,!1,0,0);let p=o.createTexture();o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,p),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MAG_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.CLAMP_TO_EDGE),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.CLAMP_TO_EDGE),await t.decode(),o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,!0),o.texImage2D(o.TEXTURE_2D,0,o.RGB,o.RGB,o.UNSIGNED_BYTE,t),o.uniform1i(o.getUniformLocation(u,`uPhoto`),0),o.uniform1f(o.getUniformLocation(u,`uImageAspect`),t.naturalWidth/t.naturalHeight);let m=o.getUniformLocation(u,`uSize`),h=o.getUniformLocation(u,`uTime`),g=o.getUniformLocation(u,`uRipples[0]`),_=new Float32Array(24),v=0,y=0,b=e.dataset.waterMotion===`paused`,x=!0,S=!1,C=0,w=0,T=0,E=0,D=()=>{S||(o.uniform1f(h,y),o.uniform4fv(g,_),o.drawArrays(o.TRIANGLES,0,3),e.dataset.waterFrames=String(++E))},O=e=>{C=0,!(b||!x||document.hidden||S)&&(e-w>=1e3/30&&(y+=Math.min((e-w)/1e3,.08),w=e,D()),C=requestAnimationFrame(O))},k=()=>{cancelAnimationFrame(C),C=0,e.dataset.waterMotion=b?`paused`:`playing`,!b&&x&&!document.hidden&&!S&&(w=performance.now(),C=requestAnimationFrame(O))},A=()=>{if(S)return;let e=Math.min(devicePixelRatio,innerWidth<761?1.25:1.5);i.width=Math.round(r.clientWidth*e),i.height=Math.round(r.clientHeight*e),o.viewport(0,0,i.width,i.height),o.uniform2f(m,i.width,i.height),D()},j=new IntersectionObserver(([e])=>{x=!!e?.isIntersecting,k()});j.observe(e);let M=new ResizeObserver(A);M.observe(r),document.addEventListener(`visibilitychange`,k),e.closest(`[data-nature-home]`).addEventListener(`nature:motion`,e=>{b=e.detail,k()});let N=t=>{if(b||n.matches||S||t.target.closest(`a, button`))return;let r=performance.now();if(t.type===`pointermove`&&(t.pointerType===`touch`||r-T<260))return;T=r;let i=e.getBoundingClientRect(),a=(t.clientX-i.left)/i.width,o=1-(t.clientY-i.top)/i.height;o>.5||(_.set([a,o,y,1],v++%6*4),e.dataset.waterRipples=String(v))};e.addEventListener(`pointermove`,N,{passive:!0}),e.addEventListener(`pointerdown`,N,{passive:!0});let P=()=>{S=!0,cancelAnimationFrame(C),j.disconnect(),M.disconnect(),a(`fallback`)};i.addEventListener(`webglcontextlost`,P),window.addEventListener(`pagehide`,e=>{cancelAnimationFrame(C),e.persisted||(P(),o.deleteTexture(p),o.deleteBuffer(d),o.deleteProgram(u))}),window.addEventListener(`pageshow`,k),a(`ready`),A(),k()}export{e as createLake};