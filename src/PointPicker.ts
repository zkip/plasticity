import { Editor } from './Editor'
import * as THREE from "three";
import { Disposable, CompositeDisposable } from 'event-kit';

const geometry = new THREE.SphereGeometry(0.05, 8, 6, 0, Math.PI * 2, 0, Math.PI);

export class PointPicker {
    editor: Editor;
    mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());

    constructor(editor: Editor) {
        this.editor = editor;
        this.mesh.material.depthTest = false;
        this.mesh.renderOrder = 999;
    }

    async execute(cb?: (pt: THREE.Vector3) => void) {
        return new Promise<THREE.Vector3>((resolve, reject) => {
            const mesh = this.mesh;
            const editor = this.editor;
            const scene = editor.db.scene;
            scene.add(mesh);
            const raycaster = new THREE.Raycaster();
            raycaster.params.Line.threshold = 0.1;

            const disposables = new CompositeDisposable();

            for (const viewport of this.editor.viewports) {
                viewport.disableControls();
                disposables.add(new Disposable(() => viewport.enableControls()))

                const renderer = viewport.renderer;
                const camera = viewport.camera;
                let constructionPlane = viewport.constructionPlane;
                if (this.restrictionPoint != null) {
                    constructionPlane = constructionPlane.restrict(this.restrictionPoint);
                }
                const domElement = renderer.domElement;

                domElement.addEventListener('pointermove', onPointerMove);
                domElement.addEventListener('pointerdown', onPointerDown);
                disposables.add(new Disposable(() => domElement.removeEventListener('pointermove', onPointerMove)));
                disposables.add(new Disposable(() => domElement.removeEventListener('pointerdown', onPointerDown)));

                const editor = this.editor;
                function onPointerMove(e: PointerEvent) {
                    const pointer = getPointer(e);
                    raycaster.setFromCamera(pointer, camera);

                    viewport.overlay.clear();
                    const pickers = editor.snapManager.pickers;
                    const pickerIntersections = raycaster.intersectObjects(pickers);
                    for (const intersection of pickerIntersections) {
                        const sprite = editor.snapManager.hoverIndicatorFor(intersection);
                        viewport.overlay.add(sprite);
                    }

                    const snappers = editor.snapManager.snappers;
                    const snapperIntersections = raycaster.intersectObjects([constructionPlane.snapper, ...snappers]);
                    for (const intersection of snapperIntersections) {
                        const [helper, point] = editor.snapManager.helperFor(intersection);
                        if (cb != null) cb(point);
                        mesh.position.copy(point);
                        if (helper != null) viewport.overlay.add(helper);
                        break;
                    }
                    editor.signals.pointPickerChanged.dispatch();
                }

                function getPointer(e: PointerEvent) {
                    const rect = domElement.getBoundingClientRect();
                    const pointer = e;

                    return {
                        x: (pointer.clientX - rect.left) / rect.width * 2 - 1,
                        y: - (pointer.clientY - rect.top) / rect.height * 2 + 1,
                        button: e.button
                    };
                }

                function onPointerDown(e: PointerEvent) {
                    viewport.overlay.clear();
                    scene.remove(mesh);
                    resolve(mesh.position.clone());
                    disposables.dispose();
                    editor.signals.pointPickerChanged.dispatch();
                }
            }
        });
    }

    restrictionPoint?: THREE.Vector3;

    restrictToPlaneThroughPoint(point: THREE.Vector3) {
        this.restrictionPoint = point;
    }
}