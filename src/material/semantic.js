/* eslint no-unused-vars: "off" */
import DataTexture from '../texture/DataTexture';
import Vector3 from '../math/Vector3';
import Matrix3 from '../math/Matrix3';
import Matrix4 from '../math/Matrix4';
import {
    TEXTURE_2D,
    TEXTURE_CUBE_MAP
} from '../constants/';

const tempVector3 = new Vector3();
const tempMatrix3 = new Matrix3();
const tempMatrix4 = new Matrix4();
const tempFloat32Array = new Float32Array([0.5, 0.5, 0.5, 1]);
const blankInfo = {
    get() {
        return undefined;
    }
};

let camera;
let gl;
let lightManager;
let state;
let fog;

/**
 * 语义
 * @namespace semantic
 * @type {Object}
 */
const semantic = {
    /**
     * @type {State}
     */
    state: null,

    /**
     * @type {Camera}
     */
    camera: null,

    /**
     * @type {LightManager}
     */
    lightManager: null,

    /**
     * @type {Fog}
     */
    fog: null,

    /**
     * @type {WebGLRenderingContext}
     */
    gl: null,

    /**
     * 初始化
     * @param  {State} _state        
     * @param  {Camera} _camera       
     * @param  {LightManager} _lightManager 
     * @param  {Fog} _fog          
     */
    init(_state, _camera, _lightManager, _fog) {
        state = this.state = _state;
        camera = this.camera = _camera;
        lightManager = this.lightManager = _lightManager;
        fog = this.fog = _fog;
        gl = this.gl = state.gl;
    },

    /**
     * 设置相机
     * @param {Camera} _camera
     */
    setCamera(_camera) {
        camera = this.camera = _camera;
    },

    handlerColorOrTexture(value, textureIndex) {
        if (value && value.isTexture) {
            return this.handlerTexture(value, textureIndex);
        }

        if (value && value.isColor) {
            value.toArray(tempFloat32Array);
        } else {
            tempFloat32Array[0] = tempFloat32Array[1] = tempFloat32Array[2] = 0.5;
        }
        return tempFloat32Array;
    },

    handlerTexture(value, textureIndex) {
        if (value && value.isTexture) {
            return this.handlerGLTexture(value.target, value.getGLTexture(state), textureIndex);
        }

        return undefined;
    },

    handlerGLTexture(target, texture, textureIndex) {
        state.activeTexture(gl.TEXTURE0 + textureIndex);
        state.bindTexture(target, texture);
        return textureIndex;
    },

    handlerUV(texture) {
        if (texture && texture.isTexture) {
            return texture.uv || 0;
        }

        return 0;
    },

    // attributes

    /**
     * @type {semanticObject}
     */
    POSITION: {
        get(mesh, material, programInfo) {
            return mesh.geometry.vertices;
        }
    },

    /**
     * @type {semanticObject}
     */
    NORMAL: {
        get(mesh, material, programInfo) {
            return mesh.geometry.normals;
        }
    },

    /**
     * @type {semanticObject}
     */
    TANGENT: {
        get(mesh, material, programInfo) {
            const normalMap = material.normalMap;
            if (normalMap && normalMap.isTexture) {
                if (Number(normalMap.uv) === 1) {
                    return mesh.geometry.tangents1;
                }
                return mesh.geometry.tangents;
            }

            return undefined;
        }
    },

    /**
     * @type {semanticObject}
     */
    TEXCOORD_0: {
        get(mesh, material, programInfo) {
            if (!mesh.geometry.uvs) {
                return undefined;
            }
            return mesh.geometry.uvs;
        }
    },

    /**
     * @type {semanticObject}
     */
    TEXCOORD_1: {
        get(mesh, material, programInfo) {
            if (!mesh.geometry.uvs1) {
                return undefined;
            }
            return mesh.geometry.uvs1;
        }
    },

    /**
     * @type {semanticObject}
     */
    CAMERAFAR: {
        get(mesh, material, programInfo) {
            if (camera.isPerspectiveCamera) {
                return camera.far;
            }
            return undefined;
        }
    },

    /**
     * @type {semanticObject}
     */
    CAMERANEAR: {
        get(mesh, material, programInfo) {
            if (camera.isPerspectiveCamera) {
                return camera.near;
            }
            return undefined;
        }
    },

    /**
     * @type {semanticObject}
     */
    CAMERATYPE: {
        get(mesh, material, programInfo) {
            if (camera.isPerspectiveCamera) {
                return 1;
            }
            return 0;
        }
    },


    /**
     * @type {semanticObject}
     */
    COLOR_0: {
        get(mesh, material, programInfo) {
            if (!mesh.geometry.colors) {
                return undefined;
            }
            return mesh.geometry.colors;
        }
    },

    /**
     * @type {semanticObject}
     */
    SKININDICES: {
        get(mesh, material, programInfo) {
            return mesh.geometry.skinIndices;
        }
    },

    /**
     * @type {semanticObject}
     */
    SKINWEIGHTS: {
        get(mesh, material, programInfo) {
            return mesh.geometry.skinWeights;
        }
    },

    // uniforms

    /**
     * @type {semanticObject}
     */
    LOCAL: {
        get(mesh, material, programInfo) {
            return mesh.matrix.elements;
        },
        isDependMesh: true
    },

    /**
     * @type {semanticObject}
     */
    MODEL: {
        get(mesh, material, programInfo) {
            return mesh.worldMatrix.elements;
        },
        isDependMesh: true
    },

    /**
     * @type {semanticObject}
     */
    VIEW: {
        get(mesh, material, programInfo) {
            return camera.viewMatrix.elements;
        }
    },

    /**
     * @type {semanticObject}
     */
    PROJECTION: {
        get(mesh, material, programInfo) {
            return camera.projectionMatrix.elements;
        }
    },

    /**
     * @type {semanticObject}
     */
    VIEWPROJECTION: {
        get(mesh, material, programInfo) {
            return camera.viewProjectionMatrix.elements;
        }
    },

    /**
     * @type {semanticObject}
     */
    MODELVIEW: {
        get(mesh, material, programInfo) {
            return camera.getModelViewMatrix(mesh, tempMatrix4).elements;
        },
        isDependMesh: true
    },

    /**
     * @type {semanticObject}
     */
    MODELVIEWPROJECTION: {
        get(mesh, material, programInfo) {
            return camera.getModelProjectionMatrix(mesh, tempMatrix4).elements;
        },
        isDependMesh: true
    },

    /**
     * @type {semanticObject}
     */
    MODELINVERSE: {
        get(mesh, material, programInfo) {
            return tempMatrix4.invert(mesh.worldMatrix).elements;
        },
        isDependMesh: true
    },

    /**
     * @type {semanticObject}
     */
    VIEWINVERSE: {
        get(mesh, material, programInfo) {
            return camera.worldMatrix.elements;
        }
    },

    /**
     * @type {semanticObject}
     */
    PROJECTIONINVERSE: {
        get(mesh, material, programInfo) {
            return tempMatrix4.invert(camera.projectionMatrix).elements;
        }
    },

    /**
     * @type {semanticObject}
     */
    MODELVIEWINVERSE: {
        get(mesh, material, programInfo) {
            return tempMatrix4.invert(camera.getModelViewMatrix(mesh, tempMatrix4)).elements;
        },
        isDependMesh: true
    },

    /**
     * @type {semanticObject}
     */
    MODELVIEWPROJECTIONINVERSE: {
        get(mesh, material, programInfo) {
            return tempMatrix4.invert(camera.getModelProjectionMatrix(mesh, tempMatrix4)).elements;
        },
        isDependMesh: true
    },

    /**
     * @type {semanticObject}
     */
    MODELINVERSETRANSPOSE: {
        get(mesh, material, programInfo) {
            return tempMatrix3.normalFromMat4(mesh.worldMatrix).elements;
        },
        isDependMesh: true
    },

    /**
     * @type {semanticObject}
     */
    MODELVIEWINVERSETRANSPOSE: {
        get(mesh, material, programInfo) {
            return tempMatrix3.normalFromMat4(camera.getModelViewMatrix(mesh, tempMatrix4)).elements;
        },
        isDependMesh: true
    },

    /**
     * @type {semanticObject}
     */
    VIEWPORT: {
        get(mesh, material, programInfo) {
            console.warn('no this semantic:', name);
        }
    },

    /**
     * @type {semanticObject}
     */
    JOINTMATRIX: {
        get(mesh, material, programInfo) {
            if (mesh.isSkinedMesh) {
                return mesh.getJointMat();
            }
            console.warn('Current mesh is not SkinedMesh!', mesh.id);
            return undefined;
        },
        isDependMesh: true,
        notSupportInstanced: true
    },

    /**
     * @type {semanticObject}
     */
    JOINTMATRIXTEXTURE: {
        get(mesh, material, programInfo) {
            if (mesh.isSkinedMesh) {
                mesh.updateJointMatTexture();
                return semantic.handlerTexture(mesh.jointMatTexture, programInfo.textureIndex);
            }
            console.warn('Current mesh is not SkinedMesh!', mesh.id);
            return undefined;
        },
        isDependMesh: true,
        notSupportInstanced: true
    },

    /**
     * @type {semanticObject}
     */
    JOINTMATRIXTEXTURESIZE: {
        get(mesh, material, programInfo) {
            if (mesh.isSkinedMesh) {
                mesh.initJointMatTexture();
                return [mesh.jointMatTexture.width, mesh.jointMatTexture.height];
            }
            console.warn('Current mesh is not SkinedMesh!', mesh.id);
            return undefined;
        },
        isDependMesh: true,
        notSupportInstanced: true
    },

    /**
     * @type {semanticObject}
     */
    NORMALMAPSCALE: {
        get(mesh, material, programInfo) {
            if (!material.normalMapScale) {
                return undefined;
            }
            return material.normalMapScale.elements;
        }
    },


    /**
     * @type {semanticObject}
     */
    SHININESS: {
        get(mesh, material, programInfo) {
            return material.shininess;
        }
    },

    /**
     * @type {semanticObject}
     */
    SPECULARENVMATRIX: {
        get(mesh, material, programInfo) {
            if (material.specularEnvMatrix && material.specularEnvMap) {
                return material.specularEnvMatrix.elements;
            }
            tempMatrix4.identity();
            return tempMatrix4.elements;
        }
    },

    /**
     * @type {semanticObject}
     */
    REFLECTIVITY: {
        get(mesh, material, programInfo) {
            return material.reflectivity;
        }
    },

    /**
     * @type {semanticObject}
     */
    REFRACTRATIO: {
        get(mesh, material, programInfo) {
            return material.refractRatio;
        }
    },

    /**
     * @type {semanticObject}
     */
    REFRACTIVITY: {
        get(mesh, material, programInfo) {
            return material.refractivity;
        }
    },

    // light

    /**
     * @type {semanticObject}
     */
    AMBIENTLIGHTSCOLOR: {
        get(mesh, material, programInfo) {
            return lightManager.ambientInfo;
        }
    },

    /**
     * @type {semanticObject}
     */
    DIRECTIONALLIGHTSCOLOR: {
        get(mesh, material, programInfo) {
            return lightManager.directionalInfo.colors;
        }
    },

    /**
     * @type {semanticObject}
     */
    DIRECTIONALLIGHTSINFO: {
        get(mesh, material, programInfo) {
            return lightManager.directionalInfo.infos;
        }
    },

    /**
     * @type {semanticObject}
     */
    DIRECTIONALLIGHTSSHADOWMAP: {
        get(mesh, material, programInfo) {
            const result = lightManager.directionalInfo.shadowMap.map((texture, i) => {
                return semantic.handlerGLTexture(TEXTURE_2D, texture, programInfo.textureIndex + i);
            });
            return result;
        }
    },

    /**
     * @type {semanticObject}
     */
    DIRECTIONALLIGHTSSHADOWMAPSIZE: {
        get(mesh, material, programInfo) {
            return lightManager.directionalInfo.shadowMapSize;
        }
    },

    /**
     * @type {semanticObject}
     */
    DIRECTIONALLIGHTSSHADOWBIAS: {
        get(mesh, material, programInfo) {
            return lightManager.directionalInfo.shadowBias;
        }
    },

    /**
     * @type {semanticObject}
     */
    DIRECTIONALLIGHTSPACEMATRIX: {
        get(mesh, material, programInfo) {
            return lightManager.directionalInfo.lightSpaceMatrix;
        }
    },

    /**
     * @type {semanticObject}
     */
    POINTLIGHTSPOS: {
        get(mesh, material, programInfo) {
            return lightManager.pointInfo.poses;
        }
    },

    /**
     * @type {semanticObject}
     */
    POINTLIGHTSCOLOR: {
        get(mesh, material, programInfo) {
            return lightManager.pointInfo.colors;
        }
    },

    /**
     * @type {semanticObject}
     */
    POINTLIGHTSINFO: {
        get(mesh, material, programInfo) {
            return lightManager.pointInfo.infos;
        }
    },

    /**
     * @type {semanticObject}
     */
    POINTLIGHTSSHADOWMAP: {
        get(mesh, material, programInfo) {
            const result = lightManager.pointInfo.shadowMap.map((texture, i) => {
                return semantic.handlerGLTexture(TEXTURE_CUBE_MAP, texture, programInfo.textureIndex + i);
            });
            return result;
        }
    },

    /**
     * @type {semanticObject}
     */
    POINTLIGHTSSHADOWBIAS: {
        get(mesh, material, programInfo) {
            return lightManager.pointInfo.shadowBias;
        }
    },

    /**
     * @type {semanticObject}
     */
    POINTLIGHTSPACEMATRIX: {
        get(mesh, material, programInfo) {
            return lightManager.pointInfo.lightSpaceMatrix;
        }
    },

    /**
     * @type {semanticObject}
     */
    SPOTLIGHTSPOS: {
        get(mesh, material, programInfo) {
            return lightManager.spotInfo.poses;
        }
    },

    /**
     * @type {semanticObject}
     */
    SPOTLIGHTSDIR: {
        get(mesh, material, programInfo) {
            return lightManager.spotInfo.dirs;
        }
    },

    /**
     * @type {semanticObject}
     */
    SPOTLIGHTSCOLOR: {
        get(mesh, material, programInfo) {
            return lightManager.spotInfo.colors;
        }
    },

    /**
     * @type {semanticObject}
     */
    SPOTLIGHTSCUTOFFS: {
        get(mesh, material, programInfo) {
            return lightManager.spotInfo.cutoffs;
        }
    },

    /**
     * @type {semanticObject}
     */
    SPOTLIGHTSINFO: {
        get(mesh, material, programInfo) {
            return lightManager.spotInfo.infos;
        }
    },

    /**
     * @type {semanticObject}
     */
    SPOTLIGHTSSHADOWMAP: {
        get(mesh, material, programInfo) {
            const result = lightManager.spotInfo.shadowMap.map((texture, i) => {
                return semantic.handlerGLTexture(TEXTURE_2D, texture, programInfo.textureIndex + i);
            });
            return result;
        }
    },

    /**
     * @type {semanticObject}
     */
    SPOTLIGHTSSHADOWMAPSIZE: {
        get(mesh, material, programInfo) {
            return lightManager.spotInfo.shadowMapSize;
        }
    },

    /**
     * @type {semanticObject}
     */
    SPOTLIGHTSSHADOWBIAS: {
        get(mesh, material, programInfo) {
            return lightManager.spotInfo.shadowBias;
        }
    },

    /**
     * @type {semanticObject}
     */
    SPOTLIGHTSPACEMATRIX: {
        get(mesh, material, programInfo) {
            return lightManager.spotInfo.lightSpaceMatrix;
        }
    },

    // fog

    /**
     * @type {semanticObject}
     */
    FOGCOLOR: {
        get(mesh, material, programInfo) {
            if (fog) {
                return fog.color.elements;
            }
            return undefined;
        }
    },

    /**
     * @type {semanticObject}
     */
    FOGINFO: {
        get(mesh, material, programInfo) {
            if (fog) {
                return fog.getInfo();
            }
            return undefined;
        }
    },

    // unQuantize

    /**
     * @type {semanticObject}
     */
    POSITIONDECODEMAT: {
        get(mesh, material, programInfo) {
            return mesh.geometry.positionDecodeMat;
        },
        isDependMesh: true
    },

    /**
     * @type {semanticObject}
     */
    NORMALDECODEMAT: {
        get(mesh, material, programInfo) {
            return mesh.geometry.normalDecodeMat;
        },
        isDependMesh: true
    },

    /**
     * @type {semanticObject}
     */
    UVDECODEMAT: {
        get(mesh, material, programInfo) {
            return mesh.geometry.uvDecodeMat;
        },
        isDependMesh: true
    },
    UV1DECODEMAT: {
        get(mesh, material, programInfo) {
            return mesh.geometry.uv1DecodeMat;
        },
        isDependMesh: true
    },

    // pbr

    /**
     * @type {semanticObject}
     */
    BASECOLOR: {
        get(mesh, material, programInfo) {
            return material.baseColor.elements;
        }
    },

    /**
     * @type {semanticObject}
     */
    METALLIC: {
        get(mesh, material, programInfo) {
            return material.metallic;
        }
    },

    /**
     * @type {semanticObject}
     */
    ROUGHNESS: {
        get(mesh, material, programInfo) {
            return material.roughness;
        }
    },


    /**
     * @type {semanticObject}
     */
    DIFFUSEENVMAP: {
        get(mesh, material, programInfo) {
            return semantic.handlerTexture(material.diffuseEnvMap, programInfo.textureIndex);
        }
    },

    /**
     * @type {semanticObject}
     */
    BRDFLUT: {
        get(mesh, material, programInfo) {
            return semantic.handlerTexture(material.brdfLUT, programInfo.textureIndex);
        }
    },

    /**
     * @type {semanticObject}
     */
    SPECULARENVMAP: {
        get(mesh, material, programInfo) {
            return semantic.handlerTexture(material.specularEnvMap, programInfo.textureIndex);
        }
    },
    GLOSSINESS: {
        get(mesh, material, programInfo) {
            return material.glossiness;
        }
    },
    ALPHACUTOFF: {
        get(mesh, material, programInfo) {
            return material.alphaCutoff;
        }
    },
    EXPOSURE: {
        get(mesh, material, programInfo) {
            return material.exposure;
        }
    },

    // Morph Animation Uniforms
    MORPHWEIGHTS: {
        isDependMesh: true,
        notSupportInstanced: true,
        get(mesh, material, programInfo) {
            const geometry = mesh.geometry;
            if (!geometry.isMorphGeometry || !geometry.weights) {
                return undefined;
            }
            return geometry.weights;
        }
    }
};


// Morph Animation Attributes
[
    ['POSITION', 'vertices'],
    ['NORMAL', 'normals'],
    ['TANGENT', 'tangents']
].forEach(info => {
    for (let i = 0; i < 8; i++) {
        semantic['MORPH' + info[0] + i] = {
            get: (function(name, i) {
                return function(mesh, material, programInfo) {
                    const geometry = mesh.geometry;
                    if (!geometry.isMorphGeometry || !geometry.targets || !geometry.targets[name]) {
                        return undefined;
                    }
                    let idx = geometry._originalMorphIndices ? geometry._originalMorphIndices[i] : i;
                    const data = geometry.targets[name][idx];
                    const idxCacheKey = `_target_${name}_${i}`;
                    if (geometry[idxCacheKey] !== idx && data) {
                        data.isDirty = true;
                        geometry[idxCacheKey] = idx;
                    }
                    return data;
                };
            }(info[1], i))
        };
    }
});


// Texture or Vector4
[
    ['DIFFUSE', 'diffuse'],
    ['SPECULAR', 'specular'],
    ['EMISSION', 'emission'],
    ['AMBIENT', 'ambient'],
].forEach(info => {
    const [
        semanticName,
        textureName,
    ] = info;

    semantic[semanticName] = {
        get(mesh, material, programInfo) {
            return semantic.handlerColorOrTexture(material[textureName], programInfo.textureIndex);
        }
    };

    semantic[`${semanticName}UV`] = {
        get(mesh, material, programInfo) {
            return semantic.handlerUV(material[textureName]);
        }
    };
});

// Texture
[
    ['NORMALMAP', 'normalMap'],
    ['PARALLAXMAP', 'parallaxMap'],
    ['BASECOLORMAP', 'baseColorMap'],
    ['METALLICMAP', 'metallicMap'],
    ['ROUGHNESSMAP', 'roughnessMap'],
    ['METALLICROUGHNESSMAP', 'metallicRoughnessMap'],
    ['OCCLUSIONMAP', 'occlusionMap'],
    ['SPECULARGLOSSINESSMAP', 'specularGlossinessMap'],
    ['LIGHTMAP', 'lightMap']
].forEach(info => {
    const [
        semanticName,
        textureName,
    ] = info;

    semantic[semanticName] = {
        get(mesh, material, programInfo) {
            return semantic.handlerTexture(material[textureName], programInfo.textureIndex);
        }
    };

    semantic[`${semanticName}UV`] = {
        get(mesh, material, programInfo) {
            return semantic.handlerUV(material[textureName]);
        }
    };
});

// TRANSPARENCY
[
    ['TRANSPARENCY', 'transparency']
].forEach(info => {
    const [
        semanticName,
        textureName,
    ] = info;

    semantic[semanticName] = {
        get(mesh, material, programInfo) {
            const value = material[textureName];
            if (value && value.isTexture) {
                return semantic.handlerTexture(value, programInfo.textureIndex);
            } else if (value !== undefined && value !== null) {
                return value;
            }

            return 1;
        }
    };

    semantic[`${semanticName}UV`] = {
        get(mesh, material, programInfo) {
            return semantic.handlerUV(material[textureName]);
        }
    };
});

/**
 * semantic 对象
 * @typedef {object} semanticObject
 * @property {Boolean} isDependMesh 是否依赖 mesh
 * @property {Boolean} notSupportInstanced 是否不支持 instanced
 * @property {Function} get 获取数据方法
 */

export default semantic;