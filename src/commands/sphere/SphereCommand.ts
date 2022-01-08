import Command from "../../command/Command";
import { PointPicker } from "../../command/PointPicker";
import { AxisSnap } from "../../editor/snaps/Snap";
import * as visual from "../../visual_model/VisualModel";
import { BooleanKeyboardGizmo } from "../boolean/BooleanKeyboardGizmo";
import { PossiblyBooleanSphereFactory } from './SphereFactory';


export class SphereCommand extends Command {
    async execute(): Promise<void> {
        const sphere = new PossiblyBooleanSphereFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        const selection = this.editor.selection.selected;
        if (selection.solids.size > 0)
            sphere.target = selection.solids.first;

        const pointPicker = new PointPicker(this.editor);
        // pointPicker.straightSnaps.delete(AxisSnap.Z);
        const { point: p1 } = await pointPicker.execute().resource(this);
        sphere.center = p1;
        pointPicker.restrictToPlaneThroughPoint(p1);

        const keyboard = new BooleanKeyboardGizmo("sphere", this.editor);
        keyboard.prepare(sphere).resource(this);

        await pointPicker.execute(({ point: p2 }) => {
            const radius = p1.distanceTo(p2);
            sphere.radius = radius;
            sphere.update();
            keyboard.toggle(sphere.isOverlapping);
        }).resource(this);

        const result = await sphere.commit() as visual.Solid;
        selection.addSolid(result);
    }
}
