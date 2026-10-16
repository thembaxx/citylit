"""Author Citylit's illustrative, low-poly stage models in Blender.

Derived from the supplied build-models.py guidance. Run with Blender 4.3+:
  blender --background --python scripts/build-landmark-models.py
Models are illustrations, not surveyed architectural reconstructions.
"""
import json
import math
import pathlib
import bpy

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public/models/stage"
OUT.mkdir(parents=True, exist_ok=True)
MATERIALS = {}


def material(name, color):
    if name not in MATERIALS:
        result = bpy.data.materials.new(name)
        result.diffuse_color = (*color, 1)
        result.use_nodes = True
        node = result.node_tree.nodes["Principled BSDF"]
        node.inputs["Base Color"].default_value = (*color, 1)
        node.inputs["Roughness"].default_value = 0.85
        MATERIALS[name] = result
    return MATERIALS[name]


STONE = material("Warm limestone", (0.48, 0.45, 0.41))
LIGHT = material("Pale stone", (0.72, 0.69, 0.62))
AMBER = material("Amber", (0.96, 0.51, 0.16))
DARK = material("Recesses", (0.16, 0.18, 0.19))
LEAF = material("Foliage", (0.39, 0.45, 0.34))


def add(operator, location, scale=None, mat=STONE, **kwargs):
    operator(location=location, **kwargs)
    obj = bpy.context.object
    if scale:
        obj.scale = scale
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    return obj


def box(x, y, z, sx, sy, sz, mat=STONE):
    return add(bpy.ops.mesh.primitive_cube_add, (x, y, z), (sx, sy, sz), mat, size=1)


def cylinder(x, y, z, radius, depth, mat=STONE, top=None, vertices=24):
    return add(bpy.ops.mesh.primitive_cone_add, (x, y, z), mat=mat,
               vertices=vertices, radius1=radius, radius2=radius if top is None else top, depth=depth)


def beam(a, b, radius=0.025, mat=AMBER):
    from mathutils import Vector
    start, end = Vector(a), Vector(b)
    obj = cylinder(*((start + end) / 2), radius, (end - start).length, mat, vertices=8)
    obj.rotation_euler = (end - start).to_track_quat("Z", "Y").to_euler()


def base():
    cylinder(0, 0, -0.10, 1.35, 0.12, LIGHT, vertices=48)
    cylinder(0, 0, -0.015, 1.23, 0.055, AMBER, vertices=48)


def park():
    for x, y, height in [(-.6, -.35, .85), (.35, .45, 1.25), (.7, -.4, .7), (-.3, .5, .6)]:
        cylinder(x, y, .25, .045, .5, DARK, vertices=8)
        cylinder(x, y, height / 2 + .25, .36, height, LEAF, top=0, vertices=7)
    box(0, -.5, .04, 1.8, .13, .08, LIGHT)


def dome():
    box(0, 0, .32, 1.8, 1.1, .64)
    box(0, 0, .68, 1.95, 1.2, .12, LIGHT)
    obj = add(bpy.ops.mesh.primitive_uv_sphere_add, (0, 0, .7), (1, 1, .65), LIGHT,
              segments=20, ring_count=8, radius=.55)
    for x in [-.72, -.36, 0, .36, .72]:
        cylinder(x, -.64, .37, .045, .65, LIGHT, vertices=8)
    cylinder(0, 0, 1.18, .022, .45, AMBER, vertices=6)


def mountain():
    # A broad flat summit and stepped sandstone face, rather than a generic cone.
    outline = [(-1.13, .12), (-.95, .72), (-.76, .82), (-.64, 1.05),
               (.74, 1.05), (.86, .88), (1.15, .40), (1.25, .08)]
    vertices = [(x, y, z) for y in [-.50, .47] for x, z in outline]
    count = len(outline)
    faces = [tuple(range(count - 1, -1, -1)), tuple(range(count, 2 * count))]
    faces += [(i, (i + 1) % count, (i + 1) % count + count, i + count) for i in range(count)]
    mesh = bpy.data.meshes.new("Flat summit and sandstone escarpment")
    mesh.from_pydata(vertices, [], faces)
    obj = bpy.data.objects.new("Table Mountain", mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(STONE)
    for z in [.27, .48, .68]:
        box(0, -.508, z, 1.7, .018, .022, LIGHT)
    beam((.73, -.3, 1.10), (1.16, -.85, .08), .012, DARK)
    box(1.00, -.65, .35, .14, .13, .12, AMBER)


def stadium():
    add(bpy.ops.mesh.primitive_torus_add, (0, 0, .24), (1.13, .77, .70), LIGHT,
        major_radius=.85, minor_radius=.20, major_segments=32, minor_segments=8)
    cylinder(0, 0, .09, .63, .10, LEAF)
    last = None
    for i in range(25):
        angle = math.pi * i / 24
        point = (-1.10 * math.cos(angle), 0, .22 + 1.32 * math.sin(angle))
        if last:
            beam(last, point, .035, LIGHT)
        last = point
    beam((0, -.63, .28), (0, 0, 1.54), .015)


def union():
    for row in range(3):
        box(0, .05 - row * .25, .06 + row * .07, 2.35 - row * .13, 1.15, .12, LIGHT)
    box(0, .1, .55, 1.8, .55, .55)
    for x in [-.90, .90]:
        box(x, .1, .72, .44, .70, 1.10, LIGHT)
        cylinder(x, .1, 1.33, .32, .25, STONE, top=0, vertices=4)
    for x in [-.56, -.28, 0, .28, .56]:
        cylinder(x, -.25, .64, .04, .61, LIGHT, vertices=8)
    cylinder(0, .1, 1.05, .015, .55, AMBER, vertices=6)


def ponte():
    for z in [.08, 1.93]:
        add(bpy.ops.mesh.primitive_torus_add, (0, 0, z), mat=AMBER if z > 1 else LIGHT,
            major_radius=.47, minor_radius=.075, major_segments=32, minor_segments=6)
    for i in range(32):
        angle = math.tau * i / 32
        cylinder(math.cos(angle) * .48, math.sin(angle) * .48, 1, .035, 1.8, LIGHT, vertices=5)
    for z in [.4, .8, 1.2, 1.6]:
        add(bpy.ops.mesh.primitive_torus_add, (0, 0, z), mat=STONE, major_radius=.48,
            minor_radius=.02, major_segments=32, minor_segments=4)


def bridge():
    box(0, 0, .32, 2.5, .45, .12, LIGHT)
    for x, height in [(-.65, 1.6), (.65, 1.25)]:
        box(x, 0, height / 2, .08, .10, height, LIGHT)
        for target in [-1.2, -.95, -.3, 0, .3, .95, 1.2]:
            beam((x, 0, height), (target, -.22, .4), .009, AMBER)


def lighthouse():
    cylinder(0, 0, .65, .32, 1.3, LIGHT, top=.22)
    cylinder(0, 0, .95, .25, .15, AMBER)
    cylinder(0, 0, 1.32, .38, .10)
    cylinder(0, 0, 1.51, .23, .30, DARK, vertices=12)
    cylinder(0, 0, 1.73, .36, .17, AMBER, top=0, vertices=12)


def hole():
    for radius, z in [(1, .08), (.84, .15), (.68, .22)]:
        add(bpy.ops.mesh.primitive_torus_add, (0, 0, z), mat=STONE,
            major_radius=radius, minor_radius=.11, major_segments=28, minor_segments=6)
    cylinder(0, 0, .02, .60, .02, DARK)
    box(.95, .30, .30, .35, .34, .5, LIGHT)
    beam((.75, .10, .50), (.60, -.55, .60), .025)


def tower():
    box(0, 0, .8, .55, .55, 1.6, LIGHT)
    for z in [.35, .7, 1.05, 1.4]:
        box(0, -.281, z, .35, .015, .12, DARK)
    cylinder(0, 0, 1.83, .45, .45, STONE, top=0, vertices=4)
    cylinder(0, 0, 2.13, .018, .30, AMBER, vertices=6)


def arch():
    for x in [-.65, .65]:
        box(x, 0, .55, .28, .38, 1.1, LIGHT)
    box(0, 0, 1.10, 1.75, .5, .22)
    cylinder(0, 0, 1.36, .15, .30, AMBER, top=0, vertices=4)


def fort():
    for x in [-.85, .85]:
        box(x, 0, .30, .20, 1.6, .6, LIGHT)
    for y in [-.75, .75]:
        box(0, y, .30, 1.9, .20, .6, LIGHT)
    for x in [-.85, .85]:
        for y in [-.75, .75]:
            cylinder(x, y, .42, .25, .84)
    box(0, -.87, .27, .30, .05, .50, DARK)
    cylinder(.55, .5, 1.02, .015, 1.0, AMBER, vertices=6)


def houses():
    for i, (x, color) in enumerate([(-.84, (.65,.35,.31)),(-.28,(.73,.61,.34)),(.28,(.43,.62,.64)),(.84,(.58,.46,.62))]):
        paint = material(f"Painted house {i}", color)
        box(x, .05, .40, .52, .8, .80, paint)
        box(x, -.36, .35, .12, .02, .45, DARK)
        for side in [-.15,.15]:
            box(x+side, -.36, .52, .11, .02, .19, LIGHT)
        box(x, .05, .83, .56, .85, .08, LIGHT)
        cylinder(x, .06, .92, .30, .22, STONE, top=0, vertices=4)


def cooling_towers():
    for center in [-.59, .59]:
        vertices, faces = [], []
        for j in range(9):
            height = j / 8 * 1.6
            radius = .28 + .18 * ((height - 1.0) / 1.0) ** 2
            for i in range(24):
                angle = math.tau * i / 24
                vertices.append((center + math.cos(angle)*radius, math.sin(angle)*radius, height))
        for j in range(8):
            for i in range(24):
                a=j*24+i;b=j*24+(i+1)%24
                faces.append((a,b,b+24,a+24))
        mesh=bpy.data.meshes.new("Hyperbolic cooling tower")
        mesh.from_pydata(vertices, [], faces)
        obj=bpy.data.objects.new("Orlando tower",mesh);bpy.context.collection.objects.link(obj)
        mesh.materials.append(LIGHT)
        cylinder(center, 0, .6, .32, .17, AMBER)
        add(bpy.ops.mesh.primitive_torus_add,(center,0,1.6),mat=STONE,major_radius=.345,minor_radius=.03,major_segments=24,minor_segments=6)
    beam((-.59,0,1.57),(.59,0,1.57),.02,DARK)


def aquarium():
    water = material("Ocean water", (.29,.56,.59))
    cylinder(0, 0, .08, 1.04, .13, water, vertices=32)
    box(-.35,.35,.39,1.4,.50,.6,LIGHT)
    for x in [-.85,-.45,-.05,.35]:
        cylinder(x,.31,.94,.24,.55,LIGHT,top=0,vertices=4)
    for x in [.55,.85]:
        cylinder(x,-.1,.65,.05,1.3,STONE,vertices=8)
    for i in range(12):
        angle=i/11*math.pi*1.5
        if i:
            beam(last,(.6+math.cos(angle)*.3,-.05+math.sin(angle)*.3,1.1-i*.075),.07,AMBER)
        last=(.6+math.cos(angle)*.3,-.05+math.sin(angle)*.3,1.1-i*.075)


BUILDERS = {"table-mountain": mountain, "stadium": stadium, "union-buildings": union,
            "ponte": ponte, "bridge": bridge, "lighthouse": lighthouse, "hole": hole,
            "park": park, "dome": dome, "tower": tower, "arch": arch, "fort": fort,
            "bo-kaap": houses, "cooling-towers": cooling_towers, "aquarium": aquarium}
manifest = []
for name, build in BUILDERS.items():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    base()
    build()
    bpy.ops.object.select_all(action="SELECT")
    # Join geometry to avoid one draw call and glTF node for every beam or column.
    bpy.ops.object.join()
    path = OUT / (name + ".glb")
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True,
                              export_draco_mesh_compression_enable=False,
                              export_cameras=False, export_lights=False)
    manifest.append({"id": name, "src": f"/models/stage/{name}.glb", "bytes": path.stat().st_size,
                     "authoring": "Blender 4.3", "purpose": "Illustrative low-poly model"})
(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(f"Exported {len(manifest)} Blender models. Run compress-stage-models.mjs to finalize and verify the size budget.")
