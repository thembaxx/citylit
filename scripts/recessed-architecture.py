"""Actual recessed architectural openings for four CityLit building classes.

This art-directed geometry pass carves masonry pockets by Blender Exact Boolean,
then authors independent inset rooms, sill/floor geometry and miniature contents.
The buildings remain original editorial interpretations, not surveys.
Blender 4.0+; use named facade shell meshes (no arbitrary object index selection).
"""

def build(name, box, material, bpy):
    if name not in ("bo-kaap", "tower", "dome", "union-buildings"):
        return False

    room = material("Interior room backing", (.28, .24, .19), roughness=.94)
    side = material("Interior reveal concrete", (.57, .54, .48), roughness=.88)
    wood = material("Interior furniture timber", (.36, .26, .19), roughness=.76)
    light = material("Interior linen and lampshades", (.72, .63, .46), roughness=.83)
    foliage = material("Interior potted leaves", (.21, .40, .25), roughness=.92)
    glass = material("Architectural window glazing", (.21, .36, .40), roughness=.10)

    def carve(solid_name, cx, front, bottom, width, height, serial):
        solid = bpy.data.objects.get(solid_name)
        if not solid or solid.type != "MESH":
            raise RuntimeError("Missing carved facade: " + solid_name)

        # Cutter is deep enough to form an architectural cavity, but not a
        # through-hole to the rear elevation. This maintains shell stability.
        bpy.ops.mesh.primitive_cube_add(size=1, location=(
            cx, front + .16, bottom + height/2
        ))
        cutter = bpy.context.object
        cutter.name = "Boolean cutter temporary %s %d" % (solid_name, serial)
        cutter.dimensions = (width, .44, height)
        bpy.context.view_layer.objects.active = cutter
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        bpy.ops.object.select_all(action="DESELECT")
        solid.select_set(True)
        bpy.context.view_layer.objects.active = solid
        cut = solid.modifiers.new("Real recessed window opening", "BOOLEAN")
        cut.operation = "DIFFERENCE"
        cut.solver = "EXACT"
        cut.object = cutter
        bpy.ops.object.modifier_apply(modifier=cut.name)
        bpy.data.objects.remove(cutter, do_unlink=True)
        solid.select_set(False)

        # Pocket depth is 0.38 with a visible enclosed rear wall and
        # separate interior furniture instead of one opaque window sticker.
        box(cx, front+.362, bottom+height/2, width*.96, .027, height*.92, room)
        box(cx, front+.16, bottom-.012, width*.96, .39, .021, wood)
        for dx in (-width*.49, width*.49):
            box(cx+dx, front+.16, bottom+height/2,
                .018, .37, height*.97, side)
        box(cx, front+.16, bottom+height, width, .38, .018, side)

        # A short shelf, silhouette and shaded furnishing create visible
        # spatial parallax as the user rotates the diorama.
        if serial % 2 == 0:
            box(cx, front+.26, bottom+.105, width*.56, .08, .027, wood)
            box(cx-width*.22, front+.27, bottom+.17, .024, .05, .105, foliage)
            box(cx-width*.22, front+.27, bottom+.235, .065, .065, .053, foliage)
        else:
            box(cx, front+.27, bottom+.082, width*.44, .105, .038, wood)
            box(cx+width*.12, front+.27, bottom+.16, .047, .04, .091, light)

        # The architectural detail pass places its own outer glass and
        # mullions for Bo-Kaap/City Hall/east Court. The heritage wing has
        # no duplicate frames, so its own inset glazed pane is needed.
        if solid_name == "RecessShellConstitutionBrick":
            box(cx, front-.020, bottom+height/2, width*.94, .012, height*.94, glass)
            for x in (cx-width/2, cx, cx+width/2):
                box(x, front-.035, bottom+height/2, .012, .024, height+.035, side)
            box(cx, front-.036, bottom+height*.54, width+.028, .020, .013, side)

    if name == "bo-kaap":
        for i, cx in enumerate((-.96, -.48, 0, .48, .96)):
            ground = .12 + .055*(i%3)
            carve("RecessShellBoKaap%d" % i, cx-.105, -.225,
                  ground+.46, .166, .245, i)
    elif name == "tower":
        for i, x in enumerate((-.88,-.58,-.29,0,.29,.58,.88)):
            carve("RecessShellDurbanHall", x, -.28, .35, .135, .28, i)
    elif name == "union-buildings":
        # Paired façades each have 8 carved, independently glazed rooms.
        # Match the actual Blender window centres in sculpt-landmark-heroes.py.
        for side in (-1, 1):
            cx = side * 1.01
            shell = "RecessShellUnionEast" if side > 0 else "RecessShellUnionWest"
            for row, z in enumerate((.40, .72)):
                for col, dx in enumerate((-.27, -.09, .09, .27)):
                    carve(shell, cx + dx, -.24, z - .095,
                          .13, .19, (row * 4 + col) + (0 if side < 0 else 8))
    elif name == "dome":
        for i, x in enumerate((.50,.73,.95)):
            carve("RecessShellConstitutionStone", x, -.23,
                  .40, .15, .27, i)
        for i, x in enumerate((-.86,-.57)):
            carve("RecessShellConstitutionBrick", x, -.265,
                  .34, .13, .30, i)
    return True
