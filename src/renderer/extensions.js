/**
 * WebGL 扩展
 * @namespace extensions
 * @type {Object}
 */
const extensions = {
    /**
     * ANGLE_instanced_arrays扩展
     * @type {ANGLEInstancedArrays}
     */
    instanced: undefined,

    /**
     * OES_vertex_array_object扩展
     * @type {OESVertexArrayObject}
     */
    vao: undefined,

    /**
     * OES_texture_float扩展
     * @type {OESTextureFloat}
     */
    texFloat: undefined,

    /**
     * WEBGL_lose_context扩展
     * @typeof {WebGLLoseContext}
     */
    loseContext: undefined,

    _usedExtensions: {},

    /**
     * 初始化
     * @param {WebGLRenderingContext} gl
     */
    init(gl) {
        this.reset(gl);
    },

    /**
     * 重置扩展
     * @param {WebGLRenderingContext} gl
     */
    reset(gl) {
        this.gl = gl;
        const usedExtensions = this._usedExtensions;
        for (let name in usedExtensions) {
            const alias = usedExtensions[name];
            this[alias] = undefined;
            this.get(name, alias);
        }
    },

    /**
     * 使用扩展
     * @param  {String} name 扩展名称
     * @param {String} [alias=name] 别名，默认和 name 相同
     */
    use(name, alias = name) {
        if (this.gl) {
            this.get(name, alias);
        } else {
            this._usedExtensions[name] = alias;
        }
    },

    /**
     * 获取扩展，如果不支持返回 null，必须在 Renderer 初始化完后用
     * @param  {String} name 扩展名称
     * @param {String} [alias=name] 别名，默认和 name 相同
     * @return {ExtensionObject|null}
     */
    get(name, alias = name) {
        let ext = this[alias];
        if (ext === undefined) {
            ext = this._getExtension(name);
            this[alias] = ext;
        }
        return ext;
    },
    _getExtension(name) {
        const gl = this.gl;

        if (gl.getExtension) {
            return gl.getExtension(name) || gl.getExtension('WEBKIT_' + name) || gl.getExtension('MOZ_' + name) || null;
        }
        return null;
    }
};

extensions.use('ANGLE_instanced_arrays', 'instanced');
extensions.use('OES_vertex_array_object', 'vao');
extensions.use('OES_texture_float', 'texFloat');
extensions.use('WEBGL_lose_context', 'loseContext');
extensions.use('OES_element_index_uint', 'uintIndices');
extensions.use('EXT_shader_texture_lod', 'shaderTextureLod');

export default extensions;