import App			from "../fungi/engine/App.js";
import Vao			from "../fungi/core/Vao.js";
import gl			from "../fungi/core/gl.js";
import Shader			from "../fungi/core/Shader.js";
import { Entity, Assemblages, Components, System } from "../fungi/engine/Ecs.js";

const ATTRIB_ROT_LOC = 8;
const ATTRIB_POS_LOC = 9;
const ATTRIB_SCL_LOC = 11;
const ATTRIB_LEN_LOC = 10;

/*
	function useDiamond(){
			const	pxz	= 0.06,
					py	= 0.1;

			const verts	= [
				0, 0, 0, 0,				// 0 Bottom
				0, 1, 0, 1,				// 1 Top
				-pxz, py,  pxz, 0,		// 2 Bot Left
				 pxz, py,  pxz, 0,		// 3 Bot Right
				 pxz, py, -pxz, 0,		// 4 Top Right
				-pxz, py, -pxz, 0		// 5 Top Left
			];

			const faces = [ 1,2,3, 1,3,4,  1,4,5,  1,5,2,
							 0,3,2, 0,4,3,  0,5,4,  0,2,5 ];
			
			e.com.Drawable.vao			= ArmaturePreview.vao(e, name, verts, faces);
			e.com.Drawable.drawMode		= Fungi.TRI;
			//e.com.Armature.vaoPreview	= e.com.Drawable.vao;
			return this;
		}
*/
		function geoDiamondWire(){
			const	pxz	= 0.06,
					py	= 0.1;

			const verts	= [
				0, 0, 0, 0,				// 0 Bottom
				0, 1, 0, 1,				// 1 Top
				-pxz, py,  pxz, 0,		// 2 Bot Left
				 pxz, py,  pxz, 0,		// 3 Bot Right
				 pxz, py, -pxz, 0,		// 4 Top Right
				-pxz, py, -pxz, 0		// 5 Top Left
			];

			const faces = [ 1,2,1,3,1,4,1,5,
							0,2,0,3,0,4,0,5,
							2,3,3,4,4,5,5,2 ];

			return { verts, faces, mode:1 }; // Line = 1
		}

		function buildPreviewVao( e, mat, meshType ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			let geo;
			switch( meshType ){
				case 0: geo = geoDiamondWire(); break;
			}


			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			//Get a list of length of the bone that the joint represent
			let boneCnt	= e.Armature.bones.length,
				aryLen	= new Float32Array( boneCnt );
			console.log("Bone Count", boneCnt);
			for(let i=0; i < boneCnt; i++) aryLen[i] = e.Armature.bones[i].Bone.length;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			let v			= new Vao(),
				elmCount	= 0;

			Vao.bind( v )
				.setInstanced( v, boneCnt )
				.floatBuffer( v, "vertex", geo.verts, Shader.POSITION_LOC, 4 )
				.floatBuffer( v, "bonelength", aryLen, ATTRIB_LEN_LOC, 1, 0, 0, false, true )
				//.emptyFloatBuffer( v, "lengths", bSize,	LEN_LOC, 1, 0, 0, true, true )
				.emptyFloatBuffer( v, "rotation",	boneCnt * 4 * 4, ATTRIB_ROT_LOC, 4, 0, 0, false, true )
				.emptyFloatBuffer( v, "position",	boneCnt * 3 * 4, ATTRIB_POS_LOC, 3, 0, 0, false, true )
				.emptyFloatBuffer( v, "scale",		boneCnt * 3 * 4, ATTRIB_SCL_LOC, 3, 0, 0, false, true );

			if( geo.faces ){
				Vao.indexBuffer( v, "index", geo.faces );
				elmCount = geo.faces.length;
			}else elmCount = geo.verts.length / 4;
			console.log( elmCount );
			Vao.finalize( v, e.info.name + "_preview", elmCount );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			e.Draw.add( v, mat, geo.mode );
			e.ArmaturePreview.vao = v;


			/*
				Float32Array.BYTES_PER_ELEMENT * vertCompLen * vertCnt, 
				Shader.POSITION_LOC, vertCompLen );


			let arm	= e.Armature,
				ap 	= e.ArmaturePreview;

			let arm	= e.com.Armature,
				ap	= e.com.ArmaturePreview;

			ArmaturePreview.flattenData( e );

			//..........................................
			//Get a list of length of the bone that the joint represent
			let bLen	= arm.bones.length,
				lenAry	= new Float32Array( bLen );

			for(let i=0; i < bLen; i++) lenAry[i] = arm.bones[i].com.Bone.length;

			//..........................................
			let oVao = new Vao().create()
				.floatBuffer("bVertices",	verts, Shader.ATTRIB_POSITION_LOC, 4)
				.floatBuffer("bLengths",	lenAry,				ATTRIB_LEN_LOC,		1, 0, 0, true, true)
				.floatBuffer("bRotation",	ap.flatRotation,	ATTRIB_ROT_LOC,		4, 0, 0, true, true)
				.floatBuffer("bPosition",	ap.flatPosition,	ATTRIB_POS_LOC,		3, 0, 0, true, true)
				.floatBuffer("bScale",		ap.flatScale,		ATTRIB_SCALE_LOC,	3, 0, 0, true, true)
				.setInstanced( bLen );

			if(faces) oVao.indexBuffer("bIndex", faces);

			let vao = oVao.finalize(name);
			oVao.cleanup();
			*/

			return v;
		}



//#################################################################
/** Create a preview mesh of armature bones */
class ArmaturePreview{
	constructor(){
		this.flatRotation	= null;
		this.flatPosition	= null;
		this.flatScale 		= null;
		this.vao			= null;
	}

	////////////////////////////////////////////////////////////////////
	//
	////////////////////////////////////////////////////////////////////
		static $( e, mat, meshType = 0 ){
			//...........................................
			if( !e.Draw || !e.Armature || !e.Node ){
				console.error( "ArmaturePreview needs an entity with the following components: Draw, Armmature, Node" );
				return e;
			}

			//...........................................
			let bLen = e.Armature.bones.length;
			if( bLen == 0 ){
				console.error( "Armature does not have any bones, Bones Needed for ArmaturePreview");
				return e;
			}

			//...........................................
			// Create component then create Type arrays to hold flatten data.
			let ap = new ArmaturePreview();
			ap.flatRotation	= new Float32Array( bLen * 4 );
			ap.flatPosition	= new Float32Array( bLen * 3 );
			ap.flatScale	= new Float32Array( bLen * 3 );
			Entity.addCom( e, ap );

			buildPreviewVao( e, mat, meshType );

			//...........................................
			//let vao;
			//switch( useType ){
			//	case 0:
					//vao = ArmaturePreview.useDiamondWire( e, e.info.name + "_preview", bLen );
			//		break;
			//}

			//e.Draw.add( vao, material=null, mode=4, opt=null )


			return e;
		}


		static useDiamond(e, name){
			const	pxz	= 0.06,
					py	= 0.1;

			const verts	= [
				0, 0, 0, 0,				// 0 Bottom
				0, 1, 0, 1,				// 1 Top
				-pxz, py,  pxz, 0,		// 2 Bot Left
				 pxz, py,  pxz, 0,		// 3 Bot Right
				 pxz, py, -pxz, 0,		// 4 Top Right
				-pxz, py, -pxz, 0		// 5 Top Left
			];

			const faces = [ 1,2,3, 1,3,4,  1,4,5,  1,5,2,
							 0,3,2, 0,4,3,  0,5,4,  0,2,5 ];
			
			e.com.Drawable.vao			= ArmaturePreview.vao(e, name, verts, faces);
			e.com.Drawable.drawMode		= Fungi.TRI;
			//e.com.Armature.vaoPreview	= e.com.Drawable.vao;
			return this;
		}

		static useDiamondWire(e, name){
			const	pxz	= 0.06,
					py	= 0.1;

			const verts	= [
				0, 0, 0, 0,				// 0 Bottom
				0, 1, 0, 1,				// 1 Top
				-pxz, py,  pxz, 0,		// 2 Bot Left
				 pxz, py,  pxz, 0,		// 3 Bot Right
				 pxz, py, -pxz, 0,		// 4 Top Right
				-pxz, py, -pxz, 0		// 5 Top Left
			];

			const faces = [ 1,2,1,3,1,4,1,5,
							0,2,0,3,0,4,0,5,
							2,3,3,4,4,5,5,2 ];
			
			e.com.Drawable.vao			= ArmaturePreview.vao(e, name, verts, faces);
			e.com.Drawable.drawMode		= Fungi.LINE;
			//e.com.Armature.vaoPreview	= e.com.Drawable.vao;
			return this;
		}



	////////////////////////////////////////////////////////////////////
	//
	////////////////////////////////////////////////////////////////////
		static vao( e, name, boneLen, verts, faces=null ){
			let v			= new Vao(),
				elmCount	= 0;


			Vao.bind( v )
				.setInstanced( v, boneLen )
				.floatBuffer( v, "vertex", verts, Shader.POSITION_LOC, 4 )
				.floatBuffer( v, "bonelength", aryLen, LEN_LOC, 1 )
				//.emptyFloatBuffer( v, "lengths", bSize,	LEN_LOC, 1, 0, 0, true, true )
				.emptyFloatBuffer( v, "rotation", rSize, ROT_LOC, 4, 0, 0, false, true )
				.emptyFloatBuffer( v, "position", pSize, POS_LOC, 3, 0, 0, false, true )
				.emptyFloatBuffer( v, "scale", sSize, SCL_LOC, 3, 0, 0, false, true )

			if( faces ){
				Vao.indexBuffer( v, "index", faces );
				elmCount = faces.length;
			}else elmCount = verts.length / 4;

			Vao.finalize( v, name, elmCount );


			/*
				Float32Array.BYTES_PER_ELEMENT * vertCompLen * vertCnt, 
				Shader.POSITION_LOC, vertCompLen );


			let arm	= e.Armature,
				ap 	= e.ArmaturePreview;

			let arm	= e.com.Armature,
				ap	= e.com.ArmaturePreview;

			ArmaturePreview.flattenData( e );

			//..........................................
			//Get a list of length of the bone that the joint represent
			let bLen	= arm.bones.length,
				lenAry	= new Float32Array( bLen );

			for(let i=0; i < bLen; i++) lenAry[i] = arm.bones[i].com.Bone.length;

			//..........................................
			let oVao = new Vao().create()
				.floatBuffer("bVertices",	verts, Shader.ATTRIB_POSITION_LOC, 4)
				.floatBuffer("bLengths",	lenAry,				ATTRIB_LEN_LOC,		1, 0, 0, true, true)
				.floatBuffer("bRotation",	ap.flatRotation,	ATTRIB_ROT_LOC,		4, 0, 0, true, true)
				.floatBuffer("bPosition",	ap.flatPosition,	ATTRIB_POS_LOC,		3, 0, 0, true, true)
				.floatBuffer("bScale",		ap.flatScale,		ATTRIB_SCALE_LOC,	3, 0, 0, true, true)
				.setInstanced( bLen );

			if(faces) oVao.indexBuffer("bIndex", faces);

			let vao = oVao.finalize(name);
			oVao.cleanup();
			*/

			return v;
		}


	////////////////////////////////////////////////////////////////////
	//
	////////////////////////////////////////////////////////////////////
		static flattenData( e ){
			let i, ii, iii, nw, 
				arm = e.Armature,
				ap 	= e.ArmaturePreview,
				pos = ap.flatPosition,
				rot = ap.flatRotation,
				scl = ap.flatScale;

			for( i=0; i < arm.bones.length; i++ ){
				nw	= arm.bones[i].Node.world;
				ii	= i * 4;
				iii	= i * 3;

				rot[ii+0]	= nw.rot[0];
				rot[ii+1]	= nw.rot[1];
				rot[ii+2]	= nw.rot[2];
				rot[ii+3]	= nw.rot[3];

				pos[iii+0]	= nw.pos[0];
				pos[iii+1]	= nw.pos[1];
				pos[iii+2]	= nw.pos[2];

				scl[iii+0]	= nw.scl[0];
				scl[iii+1]	= nw.scl[1];
				scl[iii+2]	= nw.scl[2];
			}

			return this;
		}


		static updateBuffer( e ){
			//gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, e.com.Armature.vaoPreview.bOffset.id);
			//gl.ctx.bufferSubData(gl.ctx.ARRAY_BUFFER, 0, e.com.Armature.flatWorldSpace, 0, null);
			let ap 	= e.ArmaturePreview;

			gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, ap.vao.buf.rotation.id);
			gl.ctx.bufferSubData(gl.ctx.ARRAY_BUFFER, 0, ap.flatRotation, 0, null);

			gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, ap.vao.buf.position.id);
			gl.ctx.bufferSubData(gl.ctx.ARRAY_BUFFER, 0, ap.flatPosition, 0, null);

			gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, ap.vao.buf.scale.id);
			gl.ctx.bufferSubData(gl.ctx.ARRAY_BUFFER, 0, ap.flatScale, 0, null);

			gl.ctx.bindBuffer(gl.ctx.ARRAY_BUFFER, null);
			/**/

			return this;
		}
} Components( ArmaturePreview );



//#################################################################
const QUERY_COM		= [ "Armature", "ArmaturePreview" ];
class ArmaturePreviewSystem extends System{
	static init( ecs, priority = 810 ){
		ecs.addSystem( new ArmaturePreviewSystem(), priority );
	}

	update( ecs ){
		let e, ary = ecs.queryEntities( QUERY_COM );
		for( e of ary ){
			if( e.Armature.isModified ){
				ArmaturePreview.flattenData( e );
				ArmaturePreview.updateBuffer( e );
			}
		}
	}
}


//#################################################################
export default ArmaturePreview;
export { ArmaturePreviewSystem };