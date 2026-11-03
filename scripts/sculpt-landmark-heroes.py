"""Reference-informed sculpted geometry for five recognisable South African landmarks.

These are original Blender editorial miniatures, not photogrammetry, as-built
models or copies of architectural CAD. Shapes use known distinguishing features:
- Ponte: hollow 54-storey cylindrical tower and dense concrete/window grid
- Moses Mabhida: elliptical stadium, tensile roof, signature Y-arch and cable net
- Union Buildings: paired wings, curved connecting colonnade and twin domed towers
- Table Mountain: flat sandstone mesa, rocky cliffs and the cableway
- Kimberley's Big Hole: truly recessed terraced pit and turquoise water

Coordinates are in Blender's Z-up convention. The exporter transforms to glTF Y-up.
"""

import math
import random


SUPPORTED = {"ponte", "stadium", "union-buildings", "table-mountain", "hole"}


def build(name, box, cylinder, beam, material, add, bpy):
    tau = math.tau
    stone = material("Fidelity sandstone", (.61, .53, .42), roughness=.91)
    plaster = material("Fidelity plaster", (.83, .77, .67), roughness=.82)
    concrete = material("Fidelity weathered stone", (.47, .46, .43), roughness=.84)
    deep = material("Fidelity recessed glass", (.13, .25, .29), roughness=.23, metalness=.11)
    pale_glass = material("Fidelity glass highlight", (.43, .59, .63), roughness=.16, metalness=.08)
    metal = material("Fidelity brushed metal", (.69, .72, .68), roughness=.38, metalness=.52)
    roof = material("Fidelity pale membrane", (.89, .87, .81), roughness=.69)
    grass = material("Fidelity muted grass", (.28, .49, .27), roughness=.97)
    earth = material("Fidelity sandstone earth", (.47, .31, .22), roughness=.94)
    dark_earth = material("Fidelity ironstone rock", (.32, .22, .18), roughness=.96)
    water = material("Fidelity pit water", (.13, .43, .45), roughness=.19, metalness=.07)
    copper = material("Fidelity weathered copper", (.45, .35, .28), roughness=.45, metalness=.28)
    warm = material("Fidelity window warmth", (.52, .43, .28), roughness=.48)

    def custom_mesh(title, verts, faces, materials, face_materials=None, smooth=False):
        mesh = bpy.data.meshes.new(title + " geometry")
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        for mat in materials:
            mesh.materials.append(mat)
        obj = bpy.data.objects.new(title, mesh)
        bpy.context.collection.objects.link(obj)
        if face_materials:
            for poly, index in zip(mesh.polygons, face_materials):
                poly.material_index = index
        if smooth:
            for poly in mesh.polygons:
                poly.use_smooth = True
        return obj

    def oval_strip(title, rings, mat, segments=88, close_top=False):
        vertices = []
        for rx, ry, z in rings:
            for i in range(segments):
                t = tau * i / segments
                vertices.append((rx * math.cos(t), ry * math.sin(t), z))
        faces = []
        for layer in range(len(rings) - 1):
            for j in range(segments):
                a = layer * segments + j
                b = layer * segments + (j + 1) % segments
                faces.append((a, b, b + segments, a + segments))
        if close_top:
            faces.append(tuple((len(rings) - 1) * segments + i for i in range(segments)))
        return custom_mesh(title, vertices, faces, [mat], smooth=True)

    def torus(x, y, z, radius, width, mat, major=72, minor=8):
        return add(
            bpy.ops.mesh.primitive_torus_add, (x, y, z), mat=mat,
            major_radius=radius, minor_radius=width,
            major_segments=major, minor_segments=minor,
        )

    def window(x, y, z, width=.14, height=.21, frame=plaster):
        # Shadow well behind the glazed sash reads at both near and far camera angles.
        box(x, y + .015, z, width + .035, .045, height + .035, concrete)
        box(x, y - .018, z, width, .025, height, deep)
        for offset in (-width * .5, 0, width * .5):
            box(x + offset, y - .040, z, .012, .017, height + .038, frame)
        for offset in (-height * .5, 0, height * .5):
            box(x, y - .044, z + offset, width + .035, .020, .012, frame)
        box(x, y - .07, z - height * .52, width + .08, .07, .028, stone)

    def railing(a, b, z, steps=18):
        for i in range(steps + 1):
            t = i / steps
            x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
            beam((x, y, z), (x, y, z + .14), .0065, metal)
        beam((a[0], a[1], z + .14), (b[0], b[1], z + .14), .013, metal)

    if name == "ponte":
        # The void is physical, not a dark disc painted on a filled cylinder.
        # Facade strips combine all 36 levels into one mesh to keep draw calls small.
        layers, segments = 36, 56
        outer_r, inner_r = .64, .345
        verts, faces, face_mats = [], [], []
        def quad(points, mat_index):
            offset = len(verts)
            verts.extend(points)
            faces.append((offset, offset + 1, offset + 2, offset + 3))
            face_mats.append(mat_index)
        for level in range(layers):
            z = .12 + level * .052
            for j in range(segments):
                a = tau * j / segments
                b = tau * (j + 1) / segments
                for radius, reverse in ((outer_r, False), (inner_r, True)):
                    def point(theta, r, zz):
                        return (r * math.cos(theta), r * math.sin(theta), zz)
                    outline = [point(a, radius, z), point(b, radius, z),
                               point(b, radius, z + .052), point(a, radius, z + .052)]
                    if reverse:
                        outline.reverse()
                    # Concrete slab bands + actual dark window rectangles.
                    if j % 9 == 0:
                        quad(outline, 0)
                    else:
                        quad([point(a, radius, z + .010), point(b, radius, z + .010),
                              point(b, radius, z + .041), point(a, radius, z + .041)]
                             if not reverse else
                             [point(a, radius, z + .041), point(b, radius, z + .041),
                              point(b, radius, z + .010), point(a, radius, z + .010)], 1)
                    quad([point(a, radius, z), point(b, radius, z),
                          point(b, radius, z + .010), point(a, radius, z + .010)]
                         if not reverse else
                         [point(a, radius, z + .010), point(b, radius, z + .010),
                          point(b, radius, z), point(a, radius, z)], 0)
                    quad([point(a, radius, z + .041), point(b, radius, z + .041),
                          point(b, radius, z + .052), point(a, radius, z + .052)]
                         if not reverse else
                         [point(a, radius, z + .052), point(b, radius, z + .052),
                          point(b, radius, z + .041), point(a, radius, z + .041)], 0)
        custom_mesh("Ponte hollow 54-storey facade glazing and floor slabs",
                    verts, faces, [concrete, deep], face_mats)
        for rx, width, z in ((outer_r, .025, .12), (outer_r, .025, 1.99),
                             (inner_r, .012, 1.99)):
            torus(0, 0, z, rx, width, stone)
        # Central shaft remains unobstructed. The lift tower reads on the exterior.
        box(.575, -.10, 1.02, .13, .18, 1.82, plaster)
        for z in (.35, .72, 1.1, 1.48, 1.82):
            box(.65, -.10, z, .025, .14, .075, deep)
        # Non-branded illuminated parapet rather than a reproduced corporate logo.
        for i in range(32):
            angle = tau * i / 32
            beam((.65 * math.cos(angle), .65 * math.sin(angle), 2.025),
                 (.65 * math.cos(angle), .65 * math.sin(angle), 2.11),
                 .009, metal)
        torus(0, 0, 2.11, .655, .03, copper)

    elif name == "stadium":
        # Open seating bowl with an annular roof membrane and truly free pitch.
        box(0, 0, .035, 1.20, .65, .09, grass)
        for x in (-.5, 0, .5):
            box(x, 0, .082, .012, .63, .002, plaster)
        oval_strip("Moses Mabhida seating lower bowl",
                   [(1.03, .79, .10), (.90, .69, .22), (.70, .49, .28)],
                   concrete, 96)
        oval_strip("Upper grandstands",
                   [(1.15, .84, .22), (1.10, .82, .40),
                    (.90, .69, .47), (.70, .49, .28)], stone, 96)
        oval_strip("White radial tensile canopy",
                   [(1.23, .91, .44), (1.07, .82, .54),
                    (.83, .63, .55), (.74, .54, .49)], roof, 96)
        # Fascia highlights and pitched support columns line the perimeter.
        for j in range(68):
            t = tau * j / 68
            x, y = 1.16 * math.cos(t), .84 * math.sin(t)
            beam((x * .95, y * .95, .12), (x, y, .46), .011, plaster)
            if j % 2 == 0:
                beam((x, y, .46), (.78 * math.cos(t), .56 * math.sin(t), .50),
                     .007, metal)
        # The signature arch is not a generic torus: paired south legs join.
        segments = 38
        def arch_height(t):
            return .50 + 1.50 * (math.sin(math.pi * t) ** .88)
        for j in range(segments):
            t0, t1 = j / segments, (j + 1) / segments
            beam((-1.20 + 2.40 * t0, 0, arch_height(t0)),
                 (-1.20 + 2.40 * t1, 0, arch_height(t1)),
                 .035, plaster)
        for y in (-.31, .31):
            beam((-1.22, y, .43), (-.94, 0, .94), .030, plaster)
        for i in range(29):
            t = (i + 1) / 30
            x = -1.20 + 2.40 * t
            z = arch_height(t)
            offset = (.52 + .08 * math.cos(tau * t))
            for side in (-1, 1):
                beam((x, 0, z - .055), (x * .84, side * offset, .56),
                     .0045, metal)
        # Cable car capsule is small, but visible against the arch.
        box(.05, -.015, 1.86, .095, .10, .075, pale_glass)

    elif name == "union-buildings":
        # Neo-Renaissance symmetrical wings joined by a curved open colonnade.
        for side in (-1, 1):
            cx = side * 1.01
            box(cx, .06, .55, .82, .60, .89, stone)
            box(cx, .06, 1.02, .89, .70, .07, plaster)
            for dx in (-.27, -.09, .09, .27):
                for z in (.40, .72):
                    window(cx + dx, -.265, z, .13, .19, plaster)
            # Distinct pair of cylindrical landmark tower caps.
            cylinder(cx, .14, 1.10, .24, .28, stone, vertices=20)
            cylinder(cx, .14, 1.39, .25, .34, copper, top=0, vertices=24)
            torus(cx, .14, 1.28, .25, .027, plaster, major=40)
            beam((cx, .14, 1.54), (cx, .14, 1.70), .014, metal)
            # Stepped freestone parapet.
            box(cx, -.31, .17, .91, .19, .22, plaster)
        # Original central linking wing is curved, not a flat box.
        for i in range(25):
            t = i / 24
            x = -0.66 + 1.32 * t
            y = -.35 - .27 * (1 - (x / .69) ** 2)
            box(x, y, .61, .055, .13, .66, stone)
            if i % 3 == 0:
                cylinder(x, y - .10, .57, .024, .59, plaster, vertices=9)
                box(x, y - .12, .90, .091, .10, .055, plaster)
        for i in range(24):
            t = (i + .5) / 24
            x = -.66 + 1.32 * t
            y = -.34 - .27 * (1 - (x / .69) ** 2)
            box(x, y, .96, .063, .19, .06, copper)
        for depth in range(4):
            y = -.82 - depth * .13
            box(0, y, .18 - depth * .035, 2.45 - depth * .08, .12, .082, plaster)
        for x in (-.78, -.38, 0, .38, .78):
            cylinder(x, -1.08, .12, .018, .18, metal, vertices=8)

    elif name == "table-mountain":
        # Three-dimensional mesa with terraces and asymmetric cliff walls:
        # an extruded silhouette cannot capture the Cape Town escarpment.
        segments = 52
        rings = [
            (1.24, .92, .11),
            (1.09, .78, .22),
            (.92, .69, .43),
            (.83, .62, .73),
            (.78, .57, 1.08),
            (.71, .51, 1.15),
        ]
        verts = []
        for k, (rx, ry, z) in enumerate(rings):
            for j in range(segments):
                a = tau * j / segments
                noise = 1 + .055 * math.sin(j * 1.73 + k) + .038 * math.cos(j * 2.91)
                verts.append((rx * math.cos(a) * noise,
                              ry * math.sin(a) * noise,
                              z + .028 * math.sin(j * 3.17 + k * .4)))
        faces, mat_index = [], []
        for k in range(len(rings) - 1):
            for j in range(segments):
                a = k * segments + j
                b = k * segments + (j + 1) % segments
                faces.append((a, b, b + segments, a + segments))
                mat_index.append(0 if k % 2 else 1)
        verts.append((0, 0, 1.14))
        center = len(verts) - 1
        for j in range(segments):
            faces.append(((len(rings) - 1) * segments + j,
                          (len(rings) - 1) * segments + (j + 1) % segments,
                          center))
            mat_index.append(2)
        custom_mesh("Table Mountain irregular sandstone cliffs and plateau",
                    verts, faces, [stone, earth, grass], mat_index)
        # Striations and a cableway station, carefully scaled as an illustration.
        for z, radius in ((.31, .99), (.58, .84), (.87, .75)):
            for j in range(28):
                a = tau * j / 28
                b = tau * (j + 1) / 28
                r = radius * (1 + .05 * math.sin(j * 2.7))
                beam((r * math.cos(a), r * .76 * math.sin(a), z),
                     (r * math.cos(b), r * .76 * math.sin(b), z + .014),
                     .008, dark_earth)
        box(.35, -.18, 1.22, .21, .16, .11, plaster)
        for x, y in ((.48, -.30), (.62, -.46), (.78, -.66)):
            beam((.35, -.18, 1.27), (x, y, .40), .006, metal)
        for i in range(16):
            t = i * .39
            x, y = -.6 + .08 * math.sin(t), .21 * math.cos(t)
            cylinder(x, y, 1.18, .016, .055, grass, vertices=6)

    elif name == "hole":
        # Excavation is an actual tapered terraced pit, not stacked torus hoops.
        levels, segments = 13, 64
        verts, faces, face_mats = [], [], []
        for k in range(levels + 1):
            fraction = k / levels
            radius = 1.05 - .80 * fraction
            z = .50 - .47 * fraction
            for i in range(segments):
                angle = tau * i / segments
                noise = 1 + .043 * math.sin(angle * 9 + k * .7)
                verts.append((radius * noise * math.cos(angle),
                              radius * noise * math.sin(angle),
                              z + .012 * math.sin(i * 2.1 + k)))
        for k in range(levels):
            for i in range(segments):
                a = k * segments + i
                b = k * segments + (i + 1) % segments
                faces.append((a, b, b + segments, a + segments))
                face_mats.append(0 if k % 3 else 1)
        # Low central water bed closes the pit rather than a floating dark disc.
        verts.append((0, 0, .030))
        c = len(verts) - 1
        for i in range(segments):
            faces.append((levels * segments + i,
                          levels * segments + (i + 1) % segments, c))
            face_mats.append(2)
        custom_mesh("Kimberley Big Hole terraced quarry excavation",
                    verts, faces, [earth, dark_earth, water], face_mats)
        for k in (1, 3, 6, 8, 11):
            fraction = k / levels
            radius = 1.05 - .80 * fraction
            z = .50 - .47 * fraction
            for j in range(14):
                a = tau * j / 14
                b = tau * (j + 1) / 14
                beam((radius * math.cos(a), radius * math.sin(a), z + .008),
                     (radius * math.cos(b), radius * math.sin(b), z + .008),
                     .007, stone)
        box(.90, .40, .40, .30, .26, .54, stone)
        box(.90, .245, .47, .25, .05, .29, copper)
        beam((.90, .24, .72), (.43, -.33, .71), .017, metal)
        # Safety overlook fencing around the upper front edge.
        railing((-.92, -.59), (.92, -.59), .32, 18)
    else:
        raise KeyError(name)

    return True
