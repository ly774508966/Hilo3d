import Class from '../core/Class';
import Shader from '../shader/Shader';
import screenVert from '../shader/screen.vert';
import screenFrag from '../shader/screen.frag';
import Cache from '../utils/Cache';
import Program from './Program';
import VertexArrayObject from './VertexArrayObject';
import math from '../math/math';
import Color from '../math/Color';
import GeometryData from '../geometry/GeometryData';
import capabilities from './capabilities';
import {
    getTypedArrayClass
} from '../utils/util';

import {
    TEXTURE_2D,
    RGBA,
    UNSIGNED_BYTE,
    COLOR_ATTACHMENT0,
    DEPTH_STENCIL,
    DEPTH_TEST,
    CULL_FACE,
    TRIANGLE_STRIP
} from '../constants/index';

const cache = new Cache();

/**
 * 帧缓冲
 * @class
 */
const Framebuffer = Class.create( /** @lends Framebuffer.prototype */ {
    Statics: {
        /**
         * 缓存
         * @readOnly
         * @type {Cache}
         */
        cache: {
            get() {
                return cache;
            }
        },
        /**
         * 重置所有framebuffer
         * @param  {WebGLRenderingContext} gl 
         */
        reset(gl) { // eslint-disable-line no-unused-vars
            cache.each((framebuffer) => {
                framebuffer.reset();
            });
        },
        /**
         * 销毁所有 Framebuffer
         * @param  {WebGLRenderingContext} gl 
         */
        destroy(gl) { // eslint-disable-line no-unused-vars
            cache.each((framebuffer) => {
                framebuffer.destroy();
            });
        }
    },

    /**
     * @default Framebuffer
     * @type {String}
     */
    className: 'Framebuffer',

    /**
     * @default true
     * @type {Boolean}
     */
    isFramebuffer: true,

    /**
     * bufferInternalFormat
     * @type {GLenum}
     * @default gl.DEPTH_STENCIL
     */
    bufferInternalFormat: DEPTH_STENCIL,

    target: TEXTURE_2D,
    /**
     * internalFormat
     * @type {GLenum}
     * @default gl.RGBA
     */
    internalFormat: RGBA,

    data: null,

    /**
     * format
     * @type {GLenum}
     * @default gl.RGBA
     */
    format: RGBA,

    /**
     * type
     * @type {GLenum}
     * @default gl.UNSIGNED_BYTE
     */
    type: UNSIGNED_BYTE,

    /**
     * attachment
     * @type {GLenum}
     * @default gl.COLOR_ATTACHMENT0
     */
    attachment: COLOR_ATTACHMENT0,

    /**
     * 是否需要renderbuffer
     * @type {Boolean}
     * @default true
     */
    needRenderbuffer: true,

    /**
     * 是否使用VAO
     * @type {Boolean}
     * @default true
     */
    useVao: true,

    /**
     * renderer
     * @type {Renderer}
     * @default null
     */
    renderer: null,

    /**
     * texture
     * @type {WebGLTexture}
     */
    texture: null,

    /**
     * renderbuffer
     * @type {WebGLRenderbuffer}
     */
    renderbuffer: null,

    /**
     * framebuffer
     * @type {WebGLFramebuffer}
     */
    framebuffer: null,

    _isInit: false,

    /**
     * @constructs
     * @param {WebGLRenderer}  renderer
     * @param  {Object} params 初始化参数，所有params都会复制到实例上
     */
    constructor(renderer, params) {
        this.id = math.generateUUID(this.className);
        this.renderer = renderer;
        Object.assign(this, params);

        if (!this.width) {
            this.width = renderer.width;
        }

        if (!this.height) {
            this.height = renderer.height;
        }

        cache.add(this.id, this);
    },
    /**
     * init
     * @private
     */
    init() {
        if (!this._isInit && this.renderer.isInit) {
            this._isInit = true;
            const renderer = this.renderer;
            this.gl = renderer.gl;
            this.state = renderer.state;
            this.reset();
        }
    },
    /**
     * reset
     * @private
     */
    reset() {
        this.destroyResource();
        const gl = this.gl;
        /**
         * framebuffer
         * @type {WebGLFramebuffer}
         */
        this.framebuffer = gl.createFramebuffer();
        this.bind();
        if (this.needRenderbuffer) {
            this.renderbuffer = this.createRenderbuffer();
        }

        this.texture = this.createTexture();

        if (!this.isComplete()) {
            console.warn('Framebuffer is not complete => ' + gl.checkFramebufferStatus(gl.FRAMEBUFFER));
        }

        this.unbind();
    },
    /**
     * framebuffer 是否完成
     * @return {Boolean}
     */
    isComplete() {
        const gl = this.gl;
        if (gl && gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
            return true;
        }
        return false;
    },
    /**
     * 绑定
     */
    bind() {
        this.init();
        if (this._isInit) {
            this.state.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        }
    },
    /**
     * 解绑
     */
    unbind() {
        this.init();
        if (this._isInit) {
            const state = this.state;
            state.bindFramebuffer(this.gl.FRAMEBUFFER, state.preFramebuffer);
        }
    },
    clear(clearColor = new Color(0, 0, 0, 0)) {
        if (this._isInit) {
            const {
                gl
            } = this;
            gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
    },
    /**
     * 渲染当前纹理
     * @param  {Number} [x=0]          
     * @param  {Number} [y=0]          
     * @param  {Number} [width=1]      
     * @param  {Number} [height=1]     
     * @param  {Color} clearColor 
     */
    render(x = 0, y = 0, width = 1, height = 1, clearColor) {
        if (this._isInit) {
            const {
                gl,
                state
            } = this;
            state.disable(DEPTH_TEST);
            state.disable(CULL_FACE);

            if (clearColor) {
                this.clear(clearColor);
            }

            const shader = Shader.getCustomShader(screenVert, screenFrag, '', 'FramebufferTextureShader');
            const program = Program.getProgram(shader, state);
            program.useProgram();

            let vaoId = `${x}_${y}_${width}_${height}_${program.id}`;
            const vao = VertexArrayObject.getVao(gl, vaoId, {
                useVao: this.useVao,
                useInstanced: false,
                mode: TRIANGLE_STRIP
            });

            if (vao.isDirty) {
                vao.isDirty = false;
                x = x * 2 - 1;
                y = 1 - y * 2;
                width *= 2;
                height *= 2;
                const vertices = [x, y, x + width, y, x, y - height, x + width, y - height];
                vao.addAttribute(new GeometryData(new Float32Array(vertices)), program.attributes.a_position);
                vao.addAttribute(new GeometryData(new Float32Array([0, 1, 1, 1, 0, 0, 1, 0])), program.attributes.a_texcoord0);
            }

            state.activeTexture(gl.TEXTURE0);
            state.bindTexture(gl.TEXTURE_2D, this.texture);
            vao.draw();
        }
    },
    /**
     * 生成 Renderbuffer
     * @private
     * @return {WebGLRenderbuffer}
     */
    createRenderbuffer() {
        const {
            gl,
            width,
            height
        } = this;
        const renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
        return renderbuffer;
    },
    /**
     * 生成纹理
     * @private
     * @return {WebGLTexture}
     */
    createTexture() {
        const state = this.state;
        const gl = state.gl;
        const texture = gl.createTexture();

        state.activeTexture(gl.TEXTURE0 + capabilities.MAX_TEXTURE_INDEX);
        state.bindTexture(this.target, texture);
        gl.texImage2D(this.target, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, this.data);
        gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, this.attachment, this.target, texture, 0);

        return texture;
    },
    /**
     * resize
     * @param  {Number} width  
     * @param  {Number} height 
     * @param  {Boolean} [force=true]  
     */
    resize(width, height, force) {
        if (force || this.width !== width || this.height !== height) {
            this.width = width;
            this.height = height;

            if (this._isInit) {
                this.reset();
            }
        }

    },
    /**
     * 读取区域像素
     * @param  {Number} x      
     * @param  {Number} y      
     * @param  {Number} [width=1]  
     * @param  {Number} [height=1] 
     * @return {TypedArray}        
     */
    readPixels(x, y, width = 1, height = 1) {
        const TypedArray = getTypedArrayClass(this.type);
        const pixels = new TypedArray(width * height * 4);

        if (this._isInit) {
            const gl = this.gl;
            // convert to webgl coordinate system
            y = this.height - y - height;

            this.bind();
            gl.readPixels(x, y, width, height, this.format, this.type, pixels);
            this.unbind();
        }

        return pixels;
    },
    destroy() {
        this.destroyResource();
        this.gl = null;
        cache.removeObject(this);
    },
    /**
     * 销毁资源
     */
    destroyResource() {
        const gl = this.gl;
        if (gl) {
            if (this.framebuffer) {
                gl.deleteFramebuffer(this.framebuffer);
                this.framebuffer = null;
            }

            if (this.renderbuffer) {
                gl.deleteRenderbuffer(this.renderbuffer);
                this.renderbuffer = null;
            }

            if (this.texture) {
                gl.deleteTexture(this.texture);
                this.texture = null;
            }
        }
    }
});

export default Framebuffer;