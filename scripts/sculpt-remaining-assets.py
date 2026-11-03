"""Distinct original architectural and landscape geometry for CityLit's other ten stages.

Not a survey, photogrammetric copy or measured building reconstruction. This
module is deterministic so exported assets can be reviewed and reproduced.
All dimensions use Blender Z-up and the existing 2.7m-diameter stage base.
"""

import math
import random

SUPPORTED = {
    "bridge", "lighthouse", "park", "dome", "tower", "arch",
    "fort", "bo-kaap", "cooling-towers", "aquarium",
}


def build(name, box, cylinder, beam, material, add, bpy):
    tau = math.tau
    rng = random.Random(2403)

    sandstone = material("Sculpt cut sandstone", (.68, .57, .43), roughness=.86)
    pale = material("Sculpt pale plaster", (.83, .78, .69), roughness=.82)
    brick = material("Sculpt reclaimed brick", (.60, .33, .25), roughness=.94)
    concrete = material("Sculpt weathered concrete", (.48, .49, .46), roughness=.91)
    dark = material("Sculpt recessed glazing", (.10, .24, .29), roughness=.21, metalness=.10)
    glass = material("Sculpt sea glass", (.24, .55, .58), roughness=.15, metalness=.08)
    metal = material("Sculpt structural metal", (.52, .57, .58), roughness=.37, metalness=.50)
    warm = material("Sculpt aged brass", (.59, .43, .26), roughness=.40, metalness=.52)
    wood = material("Sculpt dark wood", (.32, .24, .18), roughness=.79)
    grass = material("Sculpt garden grass", (.30, .48, .30), roughness=.96)
    leaves = material("Sculpt leaf canopy", (.22, .42, .28), roughness=.97)
    leaves2 = material("Sculpt pale foliage", (.39, .52, .32), roughness=.95)
    water = material("Sculpt deep water", (.12, .35, .43), roughness=.20, metalness=.08)
    paint = [
        material("Sculpt painted rose", (.83, .39, .41), roughness=.88),
        material("Sculpt painted ochre", (.85, .56, .28), roughness=.86),
        material("Sculpt painted turquoise", (.31, .68, .67), roughness=.86),
        material("Sculpt painted lavender", (.58, .51, .77), roughness=.86),
        material("Sculpt painted mint", (.45, .72, .53), roughness=.86),
    ]

    def geometry(title, vertices, faces, mat, smooth=False):
        mesh = bpy.data.meshes.new(title + " geometry")
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        mesh.materials.append(mat)
        obj = bpy.data.objects.new(title, mesh)
        bpy.context.collection.objects.link(obj)
        if smooth:
            for poly in mesh.polygons:
                poly.use_smooth = True
        return obj

    def wall(a, b, bottom, height, thickness, mat, title="Masonry wall"):
        x1, y1 = a
        x2, y2 = b
        dx, dy = x2 - x1, y2 - y1
        length = max(math.hypot(dx, dy), .0001)
        nx, ny = -dy / length * thickness / 2, dx / length * thickness / 2
        vertices = [
            (x1+nx,y1+ny,bottom), (x2+nx,y2+ny,bottom),
            (x2-nx,y2-ny,bottom), (x1-nx,y1-ny,bottom),
            (x1+nx,y1+ny,bottom+height), (x2+nx,y2+ny,bottom+height),
            (x2-nx,y2-ny,bottom+height), (x1-nx,y1-ny,bottom+height),
        ]
        faces = [(3,2,1,0), (4,5,6,7), (0,1,5,4), (1,2,6,5),
                 (2,3,7,6), (3,0,4,7)]
        return geometry(title, vertices, faces, mat)

    def tube_ring(cx, cy, z, rx, ry, mat, count=64, radius=.012):
        last = None
        for i in range(count + 1):
            t = tau * i / count
            point = (cx + rx*math.cos(t), cy + ry*math.sin(t), z)
            if last is not None:
                beam(last, point, radius, mat)
            last = point

    def surface_rings(title, rings, mat, n=64, close_bottom=False):
        vertices = []
        for rx, ry, cx, cy, z in rings:
            for j in range(n):
                t = tau*j/n
                vertices.append((cx+rx*math.cos(t), cy+ry*math.sin(t), z))
        faces = [
            (level*n+j, level*n+(j+1)%n,
             (level+1)*n+(j+1)%n, (level+1)*n+j)
            for level in range(len(rings)-1) for j in range(n)
        ]
        if close_bottom:
            faces.append(tuple(reversed(range(n))))
        return geometry(title, vertices, faces, mat, smooth=True)

    def opening(x, y, z, width, height, frame=pale):
        # Shadow pocket, recessed glass and four-piece raised frame.
        box(x, y, z, width+.055, .065, height+.065, sandstone)
        box(x, y-.046, z, width, .014, height, dark)
        box(x, y-.062, z, .012, .018, height+.07, frame)
        for side in (-1, 1):
            box(x+side*width/2, y-.065, z, .014, .018, height+.05, frame)
        box(x, y-.065, z+height/2, width+.04, .018, .016, frame)
        box(x, y-.065, z-height/2, width+.07, .045, .026, frame)

    def rail(a, b, posts=12, height=.15):
        for i in range(posts+1):
            t=i/posts
            p=tuple(a[j]*(1-t)+b[j]*t for j in range(3))
            beam(p, (p[0],p[1],p[2]+height), .008, metal)
        beam((a[0],a[1],a[2]+height), (b[0],b[1],b[2]+height), .014, metal)

    def archway(x, y, spring, radius, thickness=.13, depth=.20, mat=sandstone):
        # Ring segments have a real empty center, rather than a painted arch.
        n=16
        for i in range(n):
            t1=math.pi*i/n
            t2=math.pi*(i+1)/n
            points=[]
            for d in (-depth/2, depth/2):
                for r,t in ((radius,t1),(radius+thickness,t1),
                            (radius+thickness,t2),(radius,t2)):
                    points.append((x+r*math.cos(t), y+d, spring+r*math.sin(t)))
            geometry("Separate voussoir %02d"%i, points,
                     [(3,2,1,0),(4,5,6,7),(0,1,5,4),
                      (1,2,6,5),(2,3,7,6),(3,0,4,7)], mat)

    def plant(x, y, z=.05, scale=1.0):
        trunk_top = z + .37*scale
        beam((x,y,z), (x,y,trunk_top), .026*scale, wood)
        for branch in range(5):
            a=tau*branch/5
            target=(x+math.cos(a)*.20*scale, y+math.sin(a)*.18*scale,
                    trunk_top+.22*scale+(.04 if branch%2 else 0))
            beam((x,y,trunk_top-.07*scale), target, .012*scale, wood)
            add(bpy.ops.mesh.primitive_ico_sphere_add, target,
                (.28*scale,.24*scale,.24*scale),
                leaves if branch%2 else leaves2, subdivisions=2, radius=1)
        add(bpy.ops.mesh.primitive_ico_sphere_add,
            (x,y,trunk_top+.28*scale), (.30*scale,.28*scale,.23*scale),
            leaves, subdivisions=2, radius=1)

    if name == "bridge":
        # Distinct cable-stayed asymmetric bridge, continuous deck and towers.
        box(0,0,.37,2.48,.52,.13,concrete)
        box(0,0,.455,2.48,.45,.018,dark)
        box(0,0,.30,2.34,.35,.06,sandstone)
        for x in (-.70,.50):
            height=1.66 if x<0 else 1.24
            wall((x,-.12),(x,.12),.43,height-.43,.10,pale,"Bridge mast")
            box(x,0,height,.17,.30,.07,metal)
            for target in [-1.19,-.99,-.76,-.52,-.30,-.08,.15,.36,.60,.85,1.10]:
                if abs(target-x)<.14:
                    continue
                beam((x,-.045,height-.07),(target,-.18,.48),.008,metal)
        for side in (-1,1):
            y=side*.23
            rail((-1.22,y,.45),(1.22,y,.45),posts=18,height=.12)
        for x in [-1.10,-.75,-.40,-.05,.30,.65,1.00]:
            box(x,-.28,.30,.085,.08,.07,sandstone)
            box(x,.28,.30,.085,.08,.07,sandstone)
            box(x,0,.47,.08,.010,.008,pale)

    elif name == "lighthouse":
        # Tapered painted shaft with external gallery, open lantern glazing.
        surface_rings("Lighthouse tapered octagonal masonry",
            [(.38,.38,0,0,.07),(.32,.32,0,0,.50),
             (.25,.25,0,0,1.24)],pale,n=12,close_bottom=True)
        for z in (.25,.52,.80,1.07):
            tube_ring(0,0,z,.32-(z-.07)*.10,.32-(z-.07)*.10,
                      brick,count=24,radius=.018)
        for z in (.42,.91):
            opening(0,-(.38-(z-.07)*.10),z,.12,.20)
        cylinder(0,0,1.30,.39,.10,sandstone,vertices=32)
        cylinder(0,0,1.44,.245,.27,glass,vertices=16)
        for i in range(12):
            a=tau*i/12
            beam((.255*math.cos(a),.255*math.sin(a),1.34),
                 (.255*math.cos(a),.255*math.sin(a),1.59),.014,metal)
            beam((.36*math.cos(a),.36*math.sin(a),1.31),
                 (.36*math.cos(a),.36*math.sin(a),1.49),.008,metal)
        tube_ring(0,0,1.48,.36,.36,metal,count=32)
        cylinder(0,0,1.68,.38,.22,brick,top=0,vertices=16)
        cylinder(0,0,1.70,.018,.20,metal,vertices=8)
        beam((.46,-.35,.08),(.58,-.40,.75),.014,metal)

    elif name == "park":
        # Individual organic trunks and foliage, greenhouse, path, benches.
        cylinder(0,0,.04,1.16,.09,grass,vertices=64)
        for x,y,scale in [(-.67,.35,.94),(.62,.34,.83),
                          (-.72,-.32,.74),(.71,-.34,.71)]:
            plant(x,y,.10,scale)
        box(0,-.12,.065,.26,1.65,.026,sandstone)
        box(-.20,.38,.065,.66,.19,.025,sandstone)
        box(.20,-.52,.065,.73,.17,.025,sandstone)
        # Glasshouse has pitched roof with visible rafters and planting beds.
        for x in (-.30,0,.30):
            beam((x,.38,.12),(x,.38,.62),.017,metal)
            beam((x,.72,.12),(x,.72,.62),.017,metal)
            beam((x,.36,.62),(x,.55,.89),.018,metal)
            beam((x,.75,.62),(x,.55,.89),.018,metal)
        for y in (.38,.72):
            beam((-.31,y,.62),(.31,y,.62),.02,metal)
        beam((-.31,.55,.89),(.31,.55,.89),.018,metal)
        box(0,.54,.31,.53,.34,.35,glass)
        for x,y in ((-.45,-.64),(.37,-.67)):
            box(x,y,.19,.27,.12,.045,wood)
            for dx in (-.10,.10):
                box(x+dx,y,.10,.024,.09,.13,metal)
        for j in range(16):
            a=tau*j/16
            x=.34*math.cos(a)
            y=.29*math.sin(a)-.23
            cylinder(x,y,.085,.05,.045,paint[j%5],vertices=8)

    elif name == "dome":
        # Justice/civic courtyard model, not an inaccurate oversized dome.
        for x in (-.66,.66):
            box(x,.10,.49,.75,.70,.93,brick)
            box(x,.1,.97,.83,.80,.12,sandstone)
            for j in range(3):
                opening(x-.24+j*.24,-.264,.58,.13,.24)
        box(0,.42,.35,.75,.32,.62,pale)
        box(0,.37,.73,.88,.40,.10,sandstone)
        for x in (-.42,.42):
            wall((x,-.62),(x,.10),.14,.77,.10,sandstone)
        for x in (-.39,-.13,.13,.39):
            cylinder(x,-.55,.39,.025,.60,pale,vertices=12)
            box(x,-.56,.70,.075,.10,.065,sandstone)
        box(0,-.53,.73,1.06,.21,.10,sandstone)
        for x in (-.46,.46):
            opening(x,-.658,.45,.14,.26)
        for i in range(5):
            box(0,-.70-i*.085,.11-i*.014,.95+i*.08,.18,.045,pale)
        box(0,-.22,.10,1.68,.35,.05,grass)
        for x in (-.82,.82):
            plant(x,-.74,.06,.38)

    elif name == "tower":
        # Classical civic hall with central clock tower and portico.
        box(0,.12,.41,2.15,.76,.76,sandstone)
        box(0,.12,.82,2.28,.87,.09,pale)
        for x in (-.87,-.53,-.18,.18,.53,.87):
            opening(x,-.275,.49,.17,.28)
            cylinder(x,-.40,.34,.032,.62,pale,vertices=12)
            box(x,-.40,.68,.095,.10,.05,sandstone)
        box(0,-.38,.78,2.35,.19,.14,pale)
        box(0,.1,1.12,.58,.60,.70,brick)
        box(0,.1,1.47,.70,.72,.12,pale)
        for side in (-1,1):
            opening(side*.22,-.221,1.18,.12,.21)
        # Clock face, tick marks and hands placed in front of stone.
        cylinder(0,-.222,1.30,.184,.020,pale,vertices=40).rotation_euler.x=math.pi/2
        tube_ring(0,-.237,1.30,.16,.16,warm,count=32,radius=.008) if False else None
        for i in range(12):
            angle=tau*i/12
            box(math.sin(angle)*.14,-.245,1.30+math.cos(angle)*.14,
                .012,.012,.014,dark)
        beam((0,-.256,1.30),(.075,-.256,1.38),.010,dark)
        beam((0,-.259,1.30),(-.028,-.259,1.20),.008,dark)
        surface_rings("Copper civic roof",[(.44,.44,0,.1,1.53),
                                          (.09,.09,0,.1,1.90)],
                      warm,n=16)
        cylinder(0,.1,1.96,.014,.22,metal,vertices=8)

    elif name == "arch":
        # Women's memorial inspired monument with open stone arch and relief.
        for side in (-1,1):
            x=side*.48
            box(x,0,.48,.30,.39,.96,sandstone)
            box(x,0,.99,.39,.44,.12,pale)
            box(x,0,.11,.39,.48,.20,pale)
        archway(0,0,.72,.34,.17,.43,sandstone)
        box(0,0,1.34,1.48,.51,.18,pale)
        box(0,0,1.47,1.56,.54,.09,sandstone)
        for x in (-.62,.62):
            cylinder(x,-.19,1.48,.07,.17,warm,top=0,vertices=12)
        for i in range(5):
            box(0,-.36-i*.06,.045-i*.008,1.62+i*.08,.15,.038,pale)
        for x in (-.65,.65):
            box(x,-.24,.28,.13,.10,.30,brick)
        # Tall carved center relief, subtle and not photographic.
        box(0,.04,.20,.16,.14,.39,wood)
        cylinder(0,-.04,.46,.07,.13,pale,vertices=12)

    elif name == "fort":
        # Five bastions define the pentagonal fort, with an open courtyard.
        pts=[(1.07*math.cos(tau*i/5+.32),
              .86*math.sin(tau*i/5+.32)) for i in range(5)]
        inner=[(x*.69,y*.69) for x,y in pts]
        for i in range(5):
            j=(i+1)%5
            wall(pts[i],pts[j],.10,.50,.14,sandstone,"Fort outer rampart")
            wall(inner[i],inner[j],.10,.37,.08,brick,"Fort inner ring")
            # Corner bastions and squared parapets.
            x,y=pts[i]
            cylinder(x,y,.38,.24,.56,sandstone,vertices=6)
            cylinder(x,y,.70,.27,.09,pale,vertices=6)
            for k in range(4):
                a=tau*k/4
                box(x+.18*math.cos(a),y+.18*math.sin(a),
                    .78,.10,.10,.12,sandstone)
        box(0,-.73,.33,.43,.22,.52,wood)
        box(0,-.78,.64,.52,.23,.11,pale)
        box(0,-.73,.93,.38,.36,.50,brick)
        cylinder(0,-.73,1.22,.23,.16,sandstone,top=0,vertices=4)
        box(0,0,.10,1.25,.48,.045,grass)
        for i in range(9):
            x=-.74+i*.18
            box(x,-.95,.05,.12,.10,.02,pale)

    elif name == "bo-kaap":
        # Terraced Cape street, real stepped foundations and pitched roof masses.
        for i,x in enumerate((-.96,-.48,0,.48,.96)):
            ground=.12+.055*(i%3)
            front=-.39+(i%2)*.07
            box(x,.17,ground+.40,.43,.79,.80,paint[i])
            box(x,front-.07,ground+.40,.23,.035,.57,dark)
            opening(x-.11,front-.10,ground+.59,.14,.21,pale)
            box(x+.12,front-.105,ground+.22,.12,.035,.38,wood)
            box(x+.12,front-.13,ground+.23,.010,.016,.03,warm)
            # A shallow pitched roof with distinct ridge and eaves.
            for side in (-1,1):
                beam((x+side*.23,.20,ground+.83),
                     (x,.20,ground+1.04),.035,brick)
                beam((x+side*.23,-.20,ground+.83),
                     (x,-.20,ground+1.04),.035,brick)
            box(x,.15,ground+.91,.45,.81,.09,brick)
            for step in range(3):
                box(x+.12,front-.23-step*.065,
                    ground-.025-step*.018,.22,.13,.04,pale)
        box(0,-.66,.035,2.40,.36,.035,sandstone)
        for x in (-1.12,1.12):
            beam((x,-.72,.06),(x,-.72,1.22),.021,metal)
            cylinder(x,-.72,1.29,.08,.15,warm,vertices=12)

    elif name == "cooling-towers":
        # Distinct continuous hyperboloids, open circular rims and structural grid.
        for index,cx in enumerate((-.60,.60)):
            rings=[]
            for j in range(17):
                z=.08+1.64*j/16
                radius=.37+.21*((z-.95)/.87)**2
                rings.append((radius,radius,cx,0,z))
            surface_rings("Orlando open hyperboloid %d"%index,rings,
                          paint[2] if index else brick,n=40)
            for z in (.10,.52,.95,1.36,1.72):
                radius=.37+.21*((z-.95)/.87)**2
                tube_ring(cx,0,z,radius,radius,concrete,count=40,radius=.015)
            for j in range(12):
                t=tau*j/12
                beam((cx+.53*math.cos(t),.53*math.sin(t),.11),
                     (cx+.39*math.cos(t),.39*math.sin(t),1.63),
                     .009,metal)
            for stripe in range(8):
                t=tau*stripe/8
                x=cx+math.cos(t)*.40
                y=math.sin(t)*.40
                beam((x,y,.74),(x*.98,y*.98,1.16),.018,
                     paint[(stripe+index)%5])
        box(0,0,.10,2.33,1.08,.10,concrete)
        beam((-.28,0,1.70),(.28,0,1.70),.012,metal)

    elif name == "aquarium":
        # Ship-inspired ribs, separate curved tunnel, internal aquatic habitat.
        cylinder(0,0,.055,1.16,.09,sandstone,vertices=48)
        cylinder(-.20,.05,.13,.75,.11,water,vertices=48)
        box(-.50,.32,.37,1.30,.33,.64,brick)
        box(-.50,-.02,.39,1.34,.065,.50,glass)
        for x in (-1.03,-.72,-.42,-.12,.14):
            beam((x,-.12,.14),(x,-.12,.76),.018,metal)
            beam((x,-.12,.76),(x,.33,.94),.018,metal)
            beam((x,.33,.94),(x,.62,.70),.018,wood)
        # Transparent-looking tunnel arch, open pedestrian passage.
        for x in (.43,.61,.79,.97):
            last=None
            for j in range(17):
                t=math.pi*j/16
                p=(x,-.11+.34*math.cos(t),.25+.40*math.sin(t))
                if last:
                    beam(last,p,.015,metal)
                last=p
        for side in (-1,1):
            box(.70,side*.40,.16,.75,.08,.28,glass)
        for i in range(11):
            z=.28+.08*(i%3)
            x=-.75+.14*i
            y=-.08+.075*(i%4)
            add(bpy.ops.mesh.primitive_ico_sphere_add,(x,y,z),
                (.065,.026,.032),paint[i%5],subdivisions=1,radius=1)
        for i in range(14):
            a=tau*i/14
            x=math.cos(a)*.77
            y=math.sin(a)*.76
            beam((x,y,.10),(x,y,.25+.07*(i%3)),.009,grass)
        rail((.31,-.65,.16),(1.11,-.65,.16),posts=8,height=.12)

    else:
        raise ValueError("Unknown remaining-model sculpt: " + name)
    return True
