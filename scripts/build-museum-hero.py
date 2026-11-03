"""Build a reference-informed architectural miniature of Kimberley's McGregor Museum.

This is an authored interpretation of the historical Sanatorium building, not a
measured architectural survey. Blender Z-up -> glTF/Three.js Y-up.
Output: public/models/hero/mcgregor-museum.glb (before Draco compression).
The high-detail hero is deliberately separate from the small stage GLB budget.
Run after: python3 scripts/fetch-museum-pbr.py
"""
import math
import os
from pathlib import Path
import random
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
TEXTURES = ROOT / "scripts" / ".museum-pbr"
OUT = ROOT / "public" / "models" / "hero"
OUT.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for material in list(bpy.data.materials):
    bpy.data.materials.remove(material)

random.seed(36)
LAYERS = {}
for layer in ("MuseumFacade", "MuseumRoof", "MuseumGlass", "MuseumLandscape", "MuseumDetails"):
    empty = bpy.data.objects.new(layer, None)
    bpy.context.collection.objects.link(empty)
    LAYERS[layer] = empty

def image_from(folder, term, colorspace):
    directory = TEXTURES / folder
    matches = [p for p in directory.iterdir()
               if p.suffix.lower() in (".jpg", ".jpeg", ".png")
               and term.lower() in p.stem.lower()
               and "preview" not in p.stem.lower()]
    if not matches:
        raise RuntimeError("Missing CC0 PBR map: " + str(directory / term))
    image = bpy.data.images.load(str(sorted(matches)[0]), check_existing=True)
    image.colorspace_settings.name = colorspace
    image.pack()
    return image

def pbr(name, rgb, roughness=.82, metallic=0.0, texture=None, normal_strength=.55):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if texture:
        color = nodes.new("ShaderNodeTexImage")
        color.label = name + " / CC0 base color"
        color.image = image_from(texture, "Color", "sRGB")
        mat.node_tree.links.new(color.outputs["Color"], bsdf.inputs["Base Color"])
        normal = nodes.new("ShaderNodeTexImage")
        normal.label = name + " / CC0 OpenGL normal"
        normal.image = image_from(texture, "NormalGL", "Non-Color")
        nm = nodes.new("ShaderNodeNormalMap")
        nm.inputs["Strength"].default_value = normal_strength
        mat.node_tree.links.new(normal.outputs["Color"], nm.inputs["Color"])
        mat.node_tree.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
        try:
            rough = nodes.new("ShaderNodeTexImage")
            rough.image = image_from(texture, "Roughness", "Non-Color")
            mat.node_tree.links.new(rough.outputs["Color"], bsdf.inputs["Roughness"])
        except RuntimeError:
            pass
    return mat

BRICK = pbr("Heritage brick - ambientCG CC0", (.53,.26,.19), roughness=.86, texture="bricks", normal_strength=.65)
PAVING = pbr("Pathway stone - ambientCG CC0", (.70,.66,.58), roughness=.88, texture="paving", normal_strength=.48)
GRASS = pbr("Lawn - ambientCG CC0", (.33,.48,.25), roughness=.97, texture="grass", normal_strength=.45)
WOOD = pbr("Heritage wood - ambientCG CC0", (.30,.20,.13), roughness=.57, texture="wood", normal_strength=.35)
WHITE = pbr("Painted veranda trim", (.89,.85,.76), roughness=.60)
WHITE_HIGHLIGHT = pbr("Trim edge highlights", (.97,.93,.85), roughness=.43)
SOFFIT = pbr("Recessed veranda soffit shade", (.35,.31,.27), roughness=.95)
GLASS_REFLECTION = pbr("Subtle sky reflection", (.66,.79,.80), roughness=.12, metallic=.05)
GLASS_REFLECTION.node_tree.nodes.get("Principled BSDF").inputs["Alpha"].default_value = .18
GLASS_REFLECTION.blend_method = "BLEND"
BRICK_DARK = pbr("Brick mortar/corbel details", (.36,.19,.17), roughness=.87)
RED_ROOF = pbr("Weathered copper red roof", (.54,.29,.25), roughness=.43, metallic=.3)
ROOF_SEAM = pbr("Roof seam and ridge", (.38,.20,.19), roughness=.47, metallic=.28)
GLASS = pbr("Sash glazing", (.29,.42,.48), roughness=.11, metallic=.16)
# Partially transmitting panes reveal the newly recessed room surfaces.
# Keep the transmission cheap for mobile (alpha blending, no refraction passes).
GLASS.node_tree.nodes.get("Principled BSDF").inputs["Alpha"].default_value = .65
GLASS.blend_method = "BLEND"
GLASS_DARK = pbr("Deep interior", (.075,.09,.105), roughness=.68)
WARM = pbr("Interior warm walls", (.60,.43,.30), roughness=.84)
GOLD = pbr("Period brass hardware", (.70,.55,.30), roughness=.27, metallic=.78)
STONE = pbr("Sandstone plinth", (.57,.49,.38), roughness=.91)
SOIL = pbr("Landscape soil", (.27,.21,.16), roughness=.97)
BARK = pbr("Tree bark", (.32,.24,.18), roughness=.94)
LEAVES = [pbr("Foliage tone %d" % i, col, roughness=.91) for i,col in enumerate([
    (.18,.33,.20),(.23,.40,.23),(.28,.45,.25),(.36,.49,.28),(.32,.40,.22),(.42,.52,.32)])]

def uv_world(obj, tile=.85):
    mesh = obj.data
    if not isinstance(mesh, bpy.types.Mesh):
        return
    uv = mesh.uv_layers.active
    if not uv:
        uv = mesh.uv_layers.new(name="UVMap")
    mesh.calc_loop_triangles()
    for face in mesh.polygons:
        norm = face.normal
        for i in face.loop_indices:
            v = mesh.vertices[mesh.loops[i].vertex_index].co
            # Dimensions in Blender are metres in this authored scale.
            if abs(norm.z) >= abs(norm.x) and abs(norm.z) >= abs(norm.y):
                coord = (v.x / tile, v.y / tile)
            elif abs(norm.y) >= abs(norm.x):
                coord = (v.x / tile, v.z / tile)
            else:
                coord = (v.y / tile, v.z / tile)
            uv.data[i].uv = coord

def use_obj(obj, material, layer, tile=.85, smooth=False):
    if hasattr(obj.data, "materials"):
        obj.data.materials.append(material)
    if smooth and hasattr(obj.data, "polygons"):
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    uv_world(obj, tile)
    obj.parent = LAYERS[layer]
    return obj

def block(name, xyz, dims, material, layer="MuseumFacade", bevel=0.0, tile=.85):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz)
    obj = bpy.context.object
    obj.name = name
    obj.scale = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Machined edge", "BEVEL")
        modifier.width = min(bevel, min(dims) * .20)
        modifier.segments = 2
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.modifiers.new("Weighted face normals", "WEIGHTED_NORMAL")
    return use_obj(obj, material, layer, tile=tile)

def pole(name, start, finish, radius, material, layer="MuseumDetails", vertices=10):
    a, b = Vector(start), Vector(finish)
    delta = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=delta.length,
                                        location=(a+b)/2)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = delta.to_track_quat("Z", "Y").to_euler()
    return use_obj(obj, material, layer)

def cylinder(name, xyz, radius, height, material, layer="MuseumDetails", segments=18):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segments,radius=radius,depth=height,location=xyz)
    return use_obj(bpy.context.object, material, layer, smooth=True)

def surface(name, points, material, layer="MuseumRoof", thickness=.04):
    # Ordered quadrilateral with consistent winding, bottom translated along Z.
    verts = [tuple(p) for p in points] + [(p[0],p[1],p[2]-thickness) for p in points]
    faces = [(0,1,2,3),(7,6,5,4)]
    for i in range(4):
        faces.append((i,(i+1)%4,(i+1)%4+4,i+4))
    mesh = bpy.data.meshes.new(name+" geometry")
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    obj = bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    return use_obj(obj,material,layer)

def pediment(name,cx,y,width,base,peak,depth=.08):
    verts=[(cx-width/2,y,base),(cx+width/2,y,base),(cx,y,peak),
           (cx-width/2,y+depth,base),(cx+width/2,y+depth,base),(cx,y+depth,peak)]
    faces=[(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    return use_obj(obj,BRICK,"MuseumRoof",tile=.44)

def window(cx,level,front=-.610,side=False):
    # Genuine facade openings: sash windows sit within the brick rather than
    # projecting like stickers. Recessed alcoves add parallax at oblique angles.
    w,h=.28,.40
    y=front-.014
    block("Shadowed window alcove", (cx,-.372,level),(w+.045,.012,h+.045),
          GLASS_DARK,"MuseumFacade",.002)
    block("Warm interior wall", (cx,-.385,level),(w,.012,h),WARM,"MuseumFacade")
    block("Dark window side reveals", (cx,-.495,level),(w+.055,.024,h+.06),
          BRICK_DARK,"MuseumFacade",.003)
    for side_x in (-1,1):
        block("Linen curtain in recessed window",
              (cx+side_x*(w*.34),-.515,level),
              (.027,.013,h*.84),WHITE,"MuseumGlass",.003)
    block("Real recessed reflective glazing", (cx,-.633,level),
          (w,.009,h),GLASS,"MuseumGlass",.003)
    # Slim glancing reflection, visible only from the front angle.
    block("Soft glazing highlight", (cx+w*.23,-.645,level+.045),
          (.021,.004,h*.69),GLASS_REFLECTION,"MuseumGlass",.001)
    for dx in (-w/2,w/2):
        block("Painted reveal upright", (cx+dx,y-.052,level),(.023,.075,h+.09),WHITE,"MuseumFacade",.004)
    for dz in (-h/2,0,h/2):
        block("Window horizontal sash", (cx,y-.055,level+dz),(w+.05,.08,.025),WHITE_HIGHLIGHT,"MuseumFacade",.003)
    block("Window central mullion", (cx,y-.055,level),(.015,.07,h),WHITE_HIGHLIGHT,"MuseumFacade")
    for dx in (-w/4,w/4):
        block("Smaller glazing mullion", (cx+dx,y-.052,level),(.009,.04,h),WHITE,"MuseumFacade")
    block("Limestone projecting sill", (cx,y-.09,level-h/2-.025),(w+.12,.14,.04),STONE,"MuseumDetails",.008)

def porch_column(x,y,base_z,height):
    block("Painted stone square base", (x,y,base_z+.04),(.11,.11,.08),WHITE,"MuseumDetails",.007)
    cylinder("White cast-iron veranda post", (x,y,base_z+height*.51),
             .035,height*.91,WHITE,"MuseumDetails",12)
    block("Ornate column capital", (x,y,base_z+height-.035),(.15,.14,.09),WHITE_HIGHLIGHT,"MuseumDetails",.007)
    cylinder("Column collar", (x,y,base_z+height-.15),.046,.03,WHITE_HIGHLIGHT,"MuseumDetails",12)
    for offset in [-.09,.09]:
        pole("Decorative veranda bracket",(x,y,base_z+height-.12),
             (x+offset,y,base_z+height-.19),.012,WHITE_HIGHLIGHT)

# An architectural plinth gives the diorama contact and clean compositional mass.
block("Stone slab plinth", (0,0,-.22),(4.20,3.22,.20),STONE,"MuseumLandscape",.028)
block("Layered curb highlight",(0,0,-.115),(4.11,3.14,.055),PAVING,"MuseumLandscape",.008,tile=.55)
block("Landscape topsoil",(0,0,-.060),(4.03,3.05,.042),SOIL,"MuseumLandscape",.01)
block("Actual turf", (0,0,-.037),(3.94,2.96,.027),GRASS,"MuseumLandscape",.009,tile=.48)

# Building: low heritage brick wings, central two-storey volume and wall bands.
main_wall = block("Main red brick Victorian building",(0,.13,.87),
                  (3.35,1.47,1.79),BRICK,"MuseumFacade",.025,tile=.52)
# Boolean once for all windows and the entrance; keeping this as a single
# operation preserves shared UVs and avoids many expensive modifiers.
cutters = []
for z in (.47,1.31):
    for x in (-1.31,-.90,-.49,.49,.90,1.31):
        bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-.58,z))
        cutter=bpy.context.object
        cutter.name="Window recess boolean tool"
        cutter.scale=(.335,.46,.445)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        cutters.append(cutter)
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-.60,.51))
door_cutter=bpy.context.object
door_cutter.name="Recessed entrance boolean tool"
door_cutter.scale=(.56,.47,.86)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
cutters.append(door_cutter)
bpy.ops.object.select_all(action="DESELECT")
for cutter in cutters:
    cutter.select_set(True)
bpy.context.view_layer.objects.active=cutters[0]
bpy.ops.object.join()
tool=cutters[0]
bpy.ops.object.select_all(action="DESELECT")
main_wall.select_set(True)
bpy.context.view_layer.objects.active=main_wall
opening=main_wall.modifiers.new("Recessed Victorian glazing and entrance","BOOLEAN")
opening.operation="DIFFERENCE"
opening.solver="EXACT"
opening.object=tool
bpy.ops.object.modifier_apply(modifier=opening.name)
bpy.data.objects.remove(tool,do_unlink=True)
uv_world(main_wall,.52)

block("Main limestone footing",(0,.13,.105),(3.48,1.58,.16),STONE,"MuseumFacade",.009,tile=.75)
block("Cornice at first floor",(0,-.68,1.00),(3.5,.10,.052),WHITE_HIGHLIGHT,"MuseumFacade",.006)
block("First floor masonry shadow line",(0,-.624,.953),(3.34,.021,.038),
      SOFFIT,"MuseumFacade",.003)
block("Front upper brick stringcourse",(0,-.70,1.55),(3.5,.12,.056),BRICK_DARK,"MuseumFacade",.004)
block("Projecting upper eaves",(0,-.63,1.81),(3.62,.18,.065),WHITE,"MuseumRoof",.01)
# Repeating facade windows allow a readable, balanced central entrance.
for row in (0.47,1.31):
    for x in (-1.31,-.90,-.49,.49,.90,1.31):
        window(x,row)
# Deep double timber entrance and brass handles.
block("Shaded arched entrance recess",(0,-.733,.51),(.59,.08,.88),BRICK_DARK,"MuseumFacade",.014)
for x in (-.137,.137):
    block("Recessed heavy timber door",(x,-.785,.49),(.265,.05,.79),WOOD,"MuseumFacade",.009,tile=.34)
    block("Victorian wood frame",(x,-.816,.49),(.208,.026,.71),WOOD,"MuseumDetails",.008)
    cylinder("Brass door pull",(x+.047,-.840,.49),.014,.014,GOLD,"MuseumDetails")
block("Stone entrance lintel",(0,-.75,.96),(.71,.18,.082),STONE,"MuseumDetails",.009)

# Verandas: stacked walkway, 16 white columns, 80+ balusters.
block("Ground veranda deck",(0,-1.01,.13),(3.89,.72,.14),PAVING,"MuseumDetails",.012,tile=.40)
block("First-floor veranda balcony",(0,-1.00,1.035),(3.94,.76,.075),WHITE,"MuseumDetails",.012)
block("Upper veranda canopy",(0,-1.01,1.88),(4.06,.82,.075),RED_ROOF,"MuseumRoof",.011)
# Subtle baked-style underside occlusion: mobile disables live shadow maps.
# Thin inset surfaces shade the veranda without changing the 3D silhouette.
block("Upper balcony underside shade",(0,-1.00,.989),(3.69,.65,.012),
      SOFFIT,"MuseumDetails",.002)
block("Roof canopy underside shade",(0,-1.01,1.833),(3.80,.70,.012),
      SOFFIT,"MuseumRoof",.002)
block("Canopy fascia",(0,-1.45,1.848),(4.11,.06,.09),WHITE_HIGHLIGHT,"MuseumDetails",.004)
for z,h in ((.15,.89),(1.07,.78)):
    for x in (-1.86,-1.37,-.88,-.39,.10,.59,1.08,1.57,1.86):
        porch_column(x,-1.36,z,h)
for z in (1.085,):
    for i in range(65):
        x=-1.83+i*(3.66/64)
        pole("Hand-carved balcony spindle",(x,-1.444,z+.04),
             (x,-1.444,z+.33),.008,WHITE_HIGHLIGHT,vertices=7)
    block("Balcony handrail",(0,-1.445,z+.34),(3.79,.07,.047),WHITE_HIGHLIGHT,"MuseumDetails",.008)
    block("Balcony footrail",(0,-1.44,z+.02),(3.78,.07,.028),WHITE,"MuseumDetails")
    for zoffset in (.13,.27):
        block("Balcony cross balusters",(0,-1.46,z+zoffset),(3.77,.025,.014),WHITE,"MuseumDetails")
for x in (-1.9,1.9):
    for z,h in ((.15,.89),(1.07,.78)):
        porch_column(x,-.55,z,h)

# Pitched roof is separate, inspectable geometry with corrugated seams and three gables.
ridge_z=2.32
eave_z=1.81
for side in (-1,1):
    if side == -1:
        points=[(-1.91,-.78,eave_z),(1.91,-.78,eave_z),(1.91,.12,ridge_z),(-1.91,.12,ridge_z)]
    else:
        points=[(-1.91,.12,ridge_z),(1.91,.12,ridge_z),(1.91,1.02,eave_z),(-1.91,1.02,eave_z)]
    surface("Red corrugated roof slope",points,RED_ROOF)
    for x in [(-1.87+i*.17) for i in range(23)]:
        pole("Fine corrugated steel seam",
             (x, -.78 if side==-1 else .12, eave_z if side==-1 else ridge_z),
             (x, .12 if side==-1 else 1.02, ridge_z if side==-1 else eave_z),
             .006,ROOF_SEAM,"MuseumRoof",vertices=5)
block("Continuous copper ridge cap",(0,.12,ridge_z+.013),(3.89,.07,.043),ROOF_SEAM,"MuseumRoof",.005)
for cx,w in ((-1.19,.60),(0,.83),(1.19,.60)):
    pediment("Red brick triangular gable",cx,-.804,w,1.85,2.25 if cx==0 else 2.15)
    block("Gable carved base",(cx,-.857,1.846),(w+.09,.11,.042),WHITE_HIGHLIGHT,"MuseumRoof",.003)
    cylinder("Decorative high gable vent",(cx,-.872,2.018),.044,.014,BRICK_DARK,"MuseumRoof",12)
# Two tall chimney stacks create the distinct Sanatorium silhouette.
for x,y,z in ((-1.39,.48,2.04),(1.42,.51,2.06),(.35,.75,1.97)):
    block("Historic brick chimney",(x,y,z+.24),(.20,.20,.54),BRICK,"MuseumRoof",.009,tile=.45)
    block("Chimney masonry crown",(x,y,z+.50),(.28,.27,.085),STONE,"MuseumRoof",.008)
    block("Dark ceramic chimney flue",(x,y,z+.55),(.13,.13,.055),BRICK_DARK,"MuseumRoof",.004)

# Outside Victorian heritage grounds: a long paver pathway and modest flower beds.
for i in range(12):
    z=1.50-i*.08
    block("Garden walkway paving",(0,-1.56+i*.12,-.010),(.55,.093,.010),PAVING,"MuseumLandscape",.003,tile=.25)
for x in (-1.72,1.72):
    block("Raised flowerbed edging",(x,-.95,.055),(.30,.77,.09),STONE,"MuseumLandscape",.012)
    for i in range(7):
        yy=-1.31+i*.115
        cylinder("Soil planting pocket",(x,yy,.105),.083,.052,SOIL,"MuseumLandscape",12)
        # Individual lanceolate leaves rather than a row of perfect spheres.
        for j in range(7):
            theta=j*math.tau/7 + i*.36
            r=.035+.055*((j*7+i)%5)/4
            bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=5,radius=1,
                location=(x+math.cos(theta)*r,yy+math.sin(theta)*r,.17+(j%3)*.018))
            leaf=bpy.context.object
            leaf.name="Garden perennial leaf"
            leaf.scale=(.024,.063,.013)
            leaf.rotation_euler=(.45*math.sin(theta), .40*math.cos(theta), theta+.4)
            bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
            use_obj(leaf,LEAVES[(i+j)%len(LEAVES)],"MuseumLandscape",smooth=True)

# Faceted pom-poms were the main source of the cartoonish look.
# Branched trunks with many small, individually oriented leaves create softer
# silhouettes without billboards, expensive alpha sorting, or texture fetches.
for tx,ty,seed in ((-1.92,.73,11),(1.92,.70,19)):
    random.seed(seed)
    pole("Landscape tree trunk",(tx,ty,0),(tx,ty,.75),.038,BARK,"MuseumLandscape")
    for branch in range(9):
        theta=branch*2.39996
        z0=.38+branch*.045
        length=.29+random.random()*.18
        pole("Natural branch",(tx,ty,z0),
             (tx+math.cos(theta)*length,ty+math.sin(theta)*length,z0+.24),
             .012,BARK,"MuseumLandscape",vertices=7)
    for j in range(105):
        theta=j*2.39996 + seed*.14
        radius=.12+.31*math.sqrt((j+.5)/105)
        x=tx+math.cos(theta)*radius
        y=ty+math.sin(theta)*radius
        z=.72+(.28*math.sin((j+seed)*1.93))+.24*random.random()
        bpy.ops.mesh.primitive_uv_sphere_add(segments=7,ring_count=5,radius=1,
              location=(x,y,z))
        leaf=bpy.context.object
        leaf.name="Individually angled leaf clusters"
        leaf.scale=(.048+random.random()*.04,.025+random.random()*.02,
                    .068+random.random()*.035)
        leaf.rotation_euler=(random.random()*math.pi,random.random()*math.pi,
                             theta+random.random()*.45)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        use_obj(leaf,LEAVES[(j+seed)%len(LEAVES)],"MuseumLandscape",smooth=True)

# Group by layer + material to keep draw calls manageable and layer transforms separate.
for layer, empty in LAYERS.items():
    members = [obj for obj in list(bpy.data.objects)
               if obj.type == "MESH" and obj.parent == empty]
    groups = {}
    for obj in members:
        if obj.data.materials:
            key = obj.data.materials[0].name
            groups.setdefault(key, []).append(obj)
    for key, meshes in groups.items():
        if len(meshes) <= 1:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for obj in meshes:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        bpy.ops.object.join()
        meshes[0].name = layer + " - " + key

bpy.ops.object.select_all(action="SELECT")
path = OUT / "mcgregor-museum.glb"
bpy.ops.export_scene.gltf(filepath=str(path),export_format="GLB",
                          use_selection=True,export_cameras=False,export_lights=False,
                          export_draco_mesh_compression_enable=False)
print("Wrote",path,"bytes=",path.stat().st_size,
      "meshes=",len([o for o in bpy.data.objects if o.type == "MESH"]))
