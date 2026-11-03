"""Portable PBR material treatment for CityLit's authored Blender landmark assets.

Uses the same build-time CC0 ambientCG scans as McGregor Museum.
Source-resolution textures are embedded into each self-contained GLB.
Architectural geometry remains landmark-specific, not a generic building clone.
"""
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts" / ".stage-pbr"
CATEGORIES = {
    "brick": ("bricks", 0.58),
    "stone": ("paving", 0.33),
    "wood": ("wood", 0.49),
    "grass": ("grass", 0.33),
}
IMAGE_CACHE = {}


def surface_category(material_name):
    name = material_name.lower()
    if "water" in name or "glass" in name or "glazing" in name or "recess" in name:
        return None
    if "bronze" in name or "amber" in name or "metal" in name:
        return None
    if "brick" in name or "terracotta" in name:
        return "brick"
    if "wood" in name or "timber" in name:
        return "wood"
    if "leaf" in name or "foliage" in name or "lawn" in name or "grass" in name:
        return "grass"
    if any(key in name for key in (
        "limestone", "stone", "plaster", "sand", "paving", "mortar",
        "painted", "chalk", "cut ", "warm ", "pale ")):
        return "stone"
    return None


def texture(category, channel):
    key = (category, channel)
    if key in IMAGE_CACHE:
        return IMAGE_CACHE[key]
    folder = SOURCE / CATEGORIES[category][0]
    matches = sorted(p for p in folder.glob("*")
                     if p.suffix.lower() in (".jpg", ".jpeg", ".png")
                     and channel.lower() in p.name.lower())
    if not matches:
        raise RuntimeError("Missing CC0 PBR texture: %s %s" % (category, channel))
    image = bpy.data.images.load(str(matches[0]), check_existing=True)
    image.name = "CityLit CC0 %s %s" % key
    # Use the original source scan resolution; preserve sRGB vs linear texture channels.
    image.colorspace_settings.name = "sRGB" if channel == "Color" else "Non-Color"
    image.pack()
    IMAGE_CACHE[key] = image
    return image


def apply_material(mat):
    if mat.get("citylit_pbr"):
        return
    category = surface_category(mat.name)
    if not category:
        return
    if not mat.use_nodes:
        mat.use_nodes = True
    tree = mat.node_tree
    bsdf = tree.nodes.get("Principled BSDF")
    if not bsdf:
        return
    tint = tuple(mat.diffuse_color[:3]) + (1,)
    # Coloured houses and cooling-tower murals are painted surfaces. Applying
    # stone albedo to them washes out their authored palette. Retain paint
    # colour but still use rights-cleared scanned normal/roughness variation.
    if "painted" not in mat.name.lower():
        tex = tree.nodes.new("ShaderNodeTexImage")
        tex.label = "CC0 %s source-resolution albedo" % category
        tex.image = texture(category, "Color")
        tint_mix = tree.nodes.new("ShaderNodeMixRGB")
        tint_mix.blend_type = "MULTIPLY"
        tint_mix.inputs["Fac"].default_value = CATEGORIES[category][1]
        tint_mix.inputs["Color1"].default_value = tint
        tree.links.new(tex.outputs["Color"], tint_mix.inputs["Color2"])
        tree.links.new(tint_mix.outputs["Color"], bsdf.inputs["Base Color"])

    normal = tree.nodes.new("ShaderNodeTexImage")
    normal.image = texture(category, "NormalGL")
    bump = tree.nodes.new("ShaderNodeNormalMap")
    bump.inputs["Strength"].default_value = .20 if category == "grass" else .40
    tree.links.new(normal.outputs["Color"], bump.inputs["Color"])
    tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    roughness = tree.nodes.new("ShaderNodeTexImage")
    roughness.image = texture(category, "Roughness")
    tree.links.new(roughness.outputs["Color"], bsdf.inputs["Roughness"])
    mat["citylit_pbr"] = True


def uv_project(obj):
    if obj.type != "MESH":
        return
    mesh = obj.data
    layer = mesh.uv_layers.active or mesh.uv_layers.new(name="UVMap")
    for poly in mesh.polygons:
        normal = poly.normal
        axis = max(range(3), key=lambda component: abs(normal[component]))
        for corner in poly.loop_indices:
            vertex = mesh.vertices[mesh.loops[corner].vertex_index].co
            if axis == 2:
                uv = (vertex.x, vertex.y)
            elif axis == 1:
                uv = (vertex.x, vertex.z)
            else:
                uv = (vertex.y, vertex.z)
            layer.data[corner].uv = (uv[0] / .65, uv[1] / .65)


def prepare_scene_for_export():
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    for mat in bpy.data.materials:
        if mat.users:
            apply_material(mat)
    for obj in meshes:
        uv_project(obj)
    textured = sum(1 for mat in bpy.data.materials
                   if mat.users and surface_category(mat.name))
    if not textured:
        raise RuntimeError("No stage materials received PBR mapping")
    print("CC0 mapped stage surfaces:", textured, "images:", len(IMAGE_CACHE))
