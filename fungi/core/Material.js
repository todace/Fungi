import gl		from "./gl.js";
import Cache	from "./Cache.js";

class Material{
	constructor( name = "Untitled_Shader", shader = null ){
		this.name		= name;
		this.shader		= shader;
		this.uniforms	= new Map();
		this.options 	= {
			depthTest			: true,
			blend				: false,
			sampleAlphaCoverage : false,
		}
	}


	///////////////////////////////////////////////////////
	// METHODS
	///////////////////////////////////////////////////////
		// bind assigned shader
		bind(){ gl.ctx.useProgram( this.shader.program ); return this; }

		// push uniform data to the shader
		apply(){
			if( this.shader && this.uniforms.size > 0 ){
				let key, itm;
				this.shader.resetTextureSlot();

				for( [ key, itm ] of this.uniforms ){
					if(itm != null) this.shader.setUniform( key, itm );
				}
			}
			return this;
		}

		// modify stored uniform data
		updateUniform( uName, uValue ){
			let itm = this.uniforms.get(uName);
			if(!itm){
				console.error("Material.setUniform: not found %s for material %s",uName, this.name);
				return this;
			}

			itm.value = Material.parseData( uValue, itm.type );
			return this;
		}


	///////////////////////////////////////////////////////
	// STATIC METHODS
	///////////////////////////////////////////////////////

		// create new material based on shader and json data
		static build( shader, json = null ){
			let mat = new Material();
			if( json ) Material.loadJson( mat, shader, json );

			Cache.materials.set( mat.name, mat );
			return mat;
		}

		// load initate materal from shader file
		static loadJson( mat, shader, json ){
			mat.shader	= shader;
			mat.name	= json.name;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			let i;
			if( json.options ){
				for( i in json.options ){
					if( mat.options[ i ] !== undefined ){
						mat.options[ i ] = json.options[ i ];
					}
				}
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			if( json.uniforms && json.uniforms.length ){
				mat.uniforms.clear();

				for( i of json.uniforms ){
					mat.uniforms.set( i.name, Material.parseData( i.value, i.type ) );
				}
			}
		}

		// interpret data incase of custom types needs to be transformed into something else.
		static parseData( value, type ){
			switch(type){
				case "rgb"	: value = gl.rgbArray( value ); break;
				case "rgba"	: value = gl.rgbaArray( value ); break;
				
				/*
				case "tex"	: 
					let tmp = (value instanceof WebGLTexture)? value : Fungi.getTexture( value ); 
					if(tmp == null){
						console.error("Material.checkData: Texture not found %s for material %s uniform %s",uValue, this.name, uName);
						return this;
					}else value = tmp;
				break;
				*/
			}

			if(Array.isArray(value) && value.length == 0) value = null;
			
			return value;
		}
}

//##################################################################
// Export
export default Material;