import * as THREE from "three";
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import c3d from '../build/Release/c3d.node';
import MaterialDatabase from '../src/MaterialDatabase';
import { SpriteDatabase } from "../src/SpriteDatabase";

const line = new LineMaterial();
const highlight = new LineMaterial();
const hover = new LineMaterial();
const mesh = new THREE.Material();

export class FakeMaterials implements MaterialDatabase {
    get(_o: c3d.Item): THREE.Material {
        return new THREE.Material();
    }
    line(_o?: c3d.SpaceInstance): LineMaterial {
        return line;
    }
    lineDashed(): LineMaterial {
        return new LineMaterial();
    }
    setResolution(_size: THREE.Vector2): void {}
    point(_o?: c3d.Item): THREE.Material {
        return new THREE.Material();
    }
    mesh(_o?: c3d.Item | c3d.MeshBuffer, _doubleSided?: boolean): THREE.Material {
        return mesh;
    }
    highlight(_o:  c3d.TopologyItem | c3d.SpaceInstance): LineMaterial {
        return highlight;
    }
    lookup(_o: c3d.TopologyItem): THREE.Material {
        return _o instanceof c3d.Edge ? line : mesh;
    }
    hover(): LineMaterial {
        return hover;
    }
}

export class FakeSprites implements Required<SpriteDatabase> {
    isNear(): THREE.Object3D {
        throw new Error("Method not implemented.");
    }
    willSnap(): THREE.Object3D {
        throw new Error("Method not implemented.");
    }
}
