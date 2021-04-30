import { Disposable } from "event-kit";
import c3d from '../build/Release/c3d.node';
import { Curve3D, CurveEdge, CurveSegment, Face, Solid, SpaceInstance, TopologyItem } from "../VisualModel";
import { SelectionManager, SelectionMode, SelectionStrategy } from "./SelectionManager";

export class ClickStrategy implements SelectionStrategy {
    constructor(private selectionManager: SelectionManager) {
    }

    emptyIntersection(): void {
        this.selectionManager.deselectAll();
    }

    invalidIntersection(): void { }

    curve3D(object: CurveSegment, parentItem: SpaceInstance<Curve3D>): boolean {
        const model = this.selectionManager.db.lookup(parentItem);

        if (this.selectionManager.mode.has(SelectionMode.Curve)) {
            if (this.selectionManager.selectedCurves.has(parentItem)) {
                this.selectionManager.selectedCurves.delete(parentItem);
                parentItem.material = this.selectionManager.materials.line(model);
                this.selectionManager.signals.objectDeselected.dispatch(parentItem);
            } else {
                this.selectionManager.hover?.dispose();
                this.selectionManager.hover = undefined;
                this.selectionManager.selectedCurves.add(parentItem);
                parentItem.material = this.selectionManager.materials.highlight(model);
                this.selectionManager.signals.objectSelected.dispatch(parentItem);
            }
            return true;
        }
        return false;
    }

    solid(object: TopologyItem, parentItem: Solid): boolean {
        if (this.selectionManager.selectedSolids.has(parentItem)) {
            if (this.topologicalItem(object, parentItem)) {
                this.selectionManager.selectedSolids.delete(parentItem);
                this.selectionManager.signals.objectDeselected.dispatch(parentItem);
                return true;
            }
            return false;
        } else if (!this.selectionManager.selectedChildren.has(parentItem)) {
            this.selectionManager.hover?.dispose();
            this.selectionManager.hover = undefined;
            this.selectionManager.selectedSolids.add(parentItem);
            this.selectionManager.signals.objectSelected.dispatch(parentItem);
            return true;
        }
        return false;
    }

    topologicalItem(object: TopologyItem, parentItem: Solid): boolean {
        const model = this.selectionManager.db.lookupTopologyItem(object); // FIXME it would be better to not lookup anything
        if (this.selectionManager.mode.has(SelectionMode.Face) && object instanceof Face) {
            if (this.selectionManager.selectedFaces.has(object)) {
                this.selectionManager.selectedFaces.delete(object);
                object.material = this.selectionManager.materials.lookup(model);
                this.selectionManager.selectedChildren.decr(parentItem);
                this.selectionManager.signals.objectDeselected.dispatch(object);
            } else {
                this.selectionManager.hover?.dispose();
                this.selectionManager.hover = undefined;
                this.selectionManager.selectedFaces.add(object);
                object.material = this.selectionManager.materials.highlight(model);
                this.selectionManager.selectedChildren.incr(parentItem,
                    new Disposable(() => this.selectionManager.selectedFaces.delete(object)));
                this.selectionManager.signals.objectSelected.dispatch(object);
            }
            return true;
        } else if (this.selectionManager.mode.has(SelectionMode.Edge) && object instanceof CurveEdge) {
            if (this.selectionManager.selectedEdges.has(object)) {
                this.selectionManager.selectedEdges.delete(object);
                object.material = this.selectionManager.materials.lookup(model);
                this.selectionManager.selectedChildren.decr(parentItem);
                this.selectionManager.signals.objectDeselected.dispatch(object);
            } else {
                this.selectionManager.hover?.dispose();
                this.selectionManager.hover = undefined;
                this.selectionManager.selectedEdges.add(object);
                object.material = this.selectionManager.materials.highlight(model as c3d.CurveEdge);
                this.selectionManager.selectedChildren.incr(parentItem,
                    new Disposable(() => this.selectionManager.selectedEdges.delete(object)));
                this.selectionManager.signals.objectSelected.dispatch(object);
            }
            return true;
        }
        return false;
    }
}