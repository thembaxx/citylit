"""Small-scale architectural detailing shared by CityLit's fifteen illustrative landmark GLBs.

Original geometry based on editorial forms, NOT photogrammetry or surveyed building plans.
Aim for distinctive edges, material contrast, relief and shadow-catching details without
loading external assets. Coordinates are authored in Blender Z-up, with scenes about 2m tall.
"""

import math


def decorate(name, box, cylinder, beam, material, add, bpy):
    plaster = material("Porous warm plaster", (.73, .68, .57), roughness=.91)
    limestone = material("Cut sandstone highlights", (.82, .75, .63), roughness=.79)
    brick = material("Weathered earth brick", (.45, .30, .24), roughness=.94)
    bronze = material("Weathered bronze fixtures", (.27, .36, .34), roughness=.42, metalness=.55)
    glazing = material("Glazing and dark reflective panes", (.18, .35, .40), roughness=.18, metalness=.10)
    timber = material("Dark oiled timber", (.34, .22, .16), roughness=.67)
    lawn = material("Natural muted lawn", (.37, .50, .31), roughness=1)
    foliage = material("Leaf canopy variations", (.23, .42, .26), roughness=.92)
    chalk = material("Paving and mortar", (.80, .76, .67), roughness=.92)
    terracotta = material("Roof terracotta", (.59, .30, .24), roughness=.69)
    water = material("Tarnished water", (.23, .43, .46), roughness=.25, metalness=.08)

    def window(x, y, z, w=.18, h=.27, facing="front"):
        if facing == "front":
            box(x, y, z, w + .038, .042, h + .055, limestone)
            box(x, y - .024, z, w, .012, h, glazing)
            box(x, y - .034, z, .012, .018, h, limestone)
            box(x, y - .036, z, w, .018, .012, limestone)
            box(x, y - .019, z - h * .55, w + .068, .08, .036, chalk)
        else:
            box(x, y, z, .042, w + .038, h + .055, limestone)
            box(x + .024, y, z, .012, w, h, glazing)
            box(x + .034, y, z, .018, .012, h, limestone)
            box(x + .036, y, z, .018, w, .012, limestone)

    def rail(a, b, segments=7, height=.17):
        for i in range(segments + 1):
            t = i / segments
            x = a[0] * (1-t) + b[0] * t
            y = a[1] * (1-t) + b[1] * t
            z = a[2] * (1-t) + b[2] * t
            beam((x,y,z), (x,y,z+height), .009, bronze)
        beam((a[0], a[1], a[2]+height), (b[0], b[1], b[2]+height), .011, bronze)

    def ring(x, y, z, radius, thickness=.012, mat=bronze, verts=32):
        return add(bpy.ops.mesh.primitive_torus_add, (x, y, z),
                   mat=mat, major_radius=radius, minor_radius=thickness,
                   major_segments=verts, minor_segments=5)

    if name == "dome":
        for x in [-.65, -.37, .37, .65]:
            window(x, -.562, .38, .16, .33)
        for x in [-.9, .9]:
            box(x, -.59, .36, .11, .18, .59, limestone)
        box(0, -.58, .66, 2.03, .14, .075, limestone)
        for x in [-.75, -.45, -.15, .15, .45, .75]:
            box(x, -.59, .72, .15, .15, .12, plaster)
        ring(0, 0, 1.03, .35, .018, bronze)
        for a in range(12):
            t = a * math.tau / 12
            beam((math.cos(t)*.31,math.sin(t)*.31,.97),
                 (math.cos(t)*.20,math.sin(t)*.20,1.20),.011,bronze)
    elif name == "park":
        box(0, .25, .04, 1.8, .11, .065, chalk)
        box(0, .70, .04, 1.58, .12, .035, chalk)
        for x in [-.78, -.39, 0, .39, .78]:
            box(x, -.5, .095, .016, .15, .045, plaster)
        for x,y in [(-.6,-.35),(.35,.45),(.7,-.4),(-.3,.5)]:
            for k in range(7):
                a = k * math.tau / 7
                cylinder(x+.18*math.cos(a),y+.18*math.sin(a),.75,.105,.22,foliage,vertices=8)
        for x in [-.5, .5]:
            box(x,-.83,.10,.3,.10,.055,timber)
            for dx in [-.12,.12]:
                box(x+dx,-.84,.045,.026,.08,.10,bronze)
    elif name == "table-mountain":
        for z in [.20,.35,.53,.77]:
            for i in range(4):
                x=-.86+i*.55
                box(x, -.515, z, .36, .022, .026, limestone if i%2 else brick)
        for x in [-.64,-.27,.10,.46,.71]:
            cylinder(x, .1,1.05,.055,.055,foliage,vertices=9)
        rail((-.48,-.31,1.05),(.58,-.31,1.05),segments=10,height=.11)
        box(-.72,.31,1.1,.20,.13,.045,limestone)
        box(.86,-.57,.32,.21,.05,.18,plaster)
    elif name == "stadium":
        for i in range(36):
            a=math.tau*i/36
            x=math.cos(a)*.82
            y=math.sin(a)*.72
            cylinder(x,y,.18,.016,.2,bronze,vertices=6)
            if i%3==0:
                beam((x,y,.20),(math.cos(a)*1.00,math.sin(a)*.88,.47),.013,limestone)
        for y in [-.40,-.26,-.12,.02,.16,.30,.44]:
            box(0,y,.15,1.18,.028,.013,lawn)
        ring(0,0,.12,.60,.023,limestone)
    elif name == "union-buildings":
        for x in [-.69,-.46,-.23,0,.23,.46,.69]:
            window(x,-.192,.65,.13,.22)
        for x in [-.87,.87]:
            for y in [-.17,.17]:
                window(x+.23,y,.68,.10,.28,facing="side")
        box(0,-.24,.95,1.80,.16,.07,plaster)
        box(0,-.24,1.02,1.90,.22,.035,limestone)
        for x in [-1.0,-.75,-.5,-.25,0,.25,.5,.75,1.0]:
            cylinder(x,-.62,.12,.018,.19,bronze,vertices=8)
        rail((-.88,-.62,.12),(.88,-.62,.12),segments=12,height=.1)
    elif name == "ponte":
        for level in range(9):
            z=.26+level*.175
            ring(0,0,z,.45,.009,bronze,verts=32)
            for i in range(16):
                a=math.tau*i/16
                cylinder(math.cos(a)*.485,math.sin(a)*.485,z,.016,.105,glazing,vertices=5)
        for i in range(16):
            a=math.tau*i/16
            beam((math.cos(a)*.52,math.sin(a)*.52,1.85),
                 (math.cos(a)*.54,math.sin(a)*.54,2.00),.008,limestone)
        ring(0,0,1.85,.55,.019,limestone)
    elif name == "bridge":
        for x in [-1.22,-1.0,-.78,-.56,-.34,-.12,.10,.32,.54,.76,.98,1.20]:
            box(x,-.229,.405,.012,.016,.03,chalk)
            if abs(x)>.75:
                cylinder(x,.18,.42,.015,.11,bronze,vertices=7)
        rail((-1.22,.20,.38),(1.22,.20,.38),segments=14,height=.15)
        box(0,0,.24,2.48,.51,.025,bronze)
        for x in [-.65,.65]:
            box(x,0,1.02,.12,.17,.08,limestone)
    elif name == "lighthouse":
        for z in [.20,.51,.83]:
            for a in range(4):
                t=math.tau*a/4
                if a%2==0:
                    box(math.cos(t)*.24,math.sin(t)*.24,z,.11,.033,.16,glazing)
                else:
                    box(math.cos(t)*.24,math.sin(t)*.24,z,.033,.11,.16,glazing)
        for a in range(12):
            t=math.tau*a/12
            beam((math.cos(t)*.34,math.sin(t)*.34,1.37),
                 (math.cos(t)*.34,math.sin(t)*.34,1.61),.009,bronze)
        ring(0,0,1.61,.34,.014,bronze)
        ring(0,0,1.37,.34,.015,bronze)
        cylinder(0,0,1.51,.17,.25,glazing,vertices=16)
        for z in [.28,.71,1.05]:
            ring(0,0,z,.29,.009,limestone)
    elif name == "hole":
        for radius,z in [(.93,.11),(.78,.20),(.65,.28),(.51,.35),(.40,.42)]:
            ring(0,0,z,radius,.016,brick)
        cylinder(0,0,.09,.40,.02,water,vertices=36)
        for x in [-.8,-.5,-.2,.1,.4,.7]:
            box(x,-.94,.09,.08,.06,.05,limestone)
        rail((.50,.43,.38),(1.05,.43,.38),segments=6,height=.18)
        box(.89,.30,.65,.26,.37,.035,timber)
        box(.89,.30,.48,.34,.04,.33,limestone)
    elif name == "tower":
        for z in [.35,.70,1.05,1.40]:
            for y in [-.28,.28]:
                box(0,y,z,.36,.022,.035,limestone)
                for x in [-.13,0,.13]:
                    box(x,y+( -.018 if y<0 else .018),z,.083,.018,.18,glazing)
        for z in [.21,.51,.81,1.11,1.41]:
            box(-.29,0,z,.04,.60,.05,limestone)
            box(.29,0,z,.04,.60,.05,limestone)
        cylinder(0,-.293,1.66,.18,.025,limestone,vertices=32)
        for dx,dz in [(0,.095),(.065,.025)]:
            beam((0,-.318,1.66), (dx,-.318,1.66+dz), .012,bronze)
    elif name == "arch":
        for x in [-.64,.64]:
            for z in [.22,.46,.70,.94]:
                box(x,-.201,z,.30,.024,.029,limestone)
            for y in [-.21,.21]:
                box(x,y,.56,.035,.031,.8,brick)
        box(0,0,1.24,1.82,.53,.06,limestone)
        for x in [-.47,-.24,0,.24,.47]:
            box(x,-.26,1.01,.14,.024,.09,plaster)
        rail((-.93,-.21,.18),(.93,-.21,.18),segments=8,height=.10)
    elif name == "fort":
        for x in [-.87,.87]:
            for y in [-.75,-.45,-.15,.15,.45,.75]:
                box(x,y,.70,.18,.14,.13,limestone)
        for y in [-.77,.77]:
            for x in [-.74,-.45,-.16,.13,.42,.71]:
                box(x,y,.70,.14,.18,.13,limestone)
        box(0,-.91,.50,.42,.13,.06,limestone)
        box(0,-.90,.20,.23,.04,.35,timber)
        rail((-.66,-.66,.62),(.66,-.66,.62),segments=8,height=.12)
    elif name == "bo-kaap":
        for i,x in enumerate([-.84,-.28,.28,.84]):
            box(x,-.377,.54,.36,.028,.04,limestone)
            for dx in [-.17,.17]:
                box(x+dx,-.38,.39,.036,.04,.39,chalk)
            window(x,-.39,.59,.18,.22)
            box(x,-.40,.15,.21,.045,.29,timber)
            box(x,-.41,.13,.015,.05,.20,bronze)
            for step in range(2):
                box(x,-.46-step*.07,.045-step*.02,.33+step*.06,.18,.036,limestone)
            box(x,-.38,.84,.55,.08,.04,terracotta)
        box(0,-.57,.012,2.45,.30,.026,chalk)
    elif name == "cooling-towers":
        for center in [-.59,.59]:
            for z in [.27,.56,.84,1.13,1.42]:
                radius=.28+.18*((z-1.0))**2
                ring(center,0,z,radius+.02,.015,brick)
            for a in range(8):
                t=a*math.tau/8
                beam((center+math.cos(t)*.39,math.sin(t)*.39,.14),
                     (center+math.cos(t)*.45,math.sin(t)*.45,.46),.01,bronze)
            rail((center-.35,-.18,.14),(center+.35,-.18,.14),segments=4,height=.12)
        box(0,0,1.62,.9,.07,.045,bronze)
    elif name == "aquarium":
        box(-.35,-.005,.51,1.43,.05,.29,glazing)
        for x in [-.87,-.47,-.07,.33]:
            box(x,-.04,.56,.05,.06,.42,bronze)
        box(-.35,-.05,.77,1.47,.12,.035,limestone)
        for x in [.52,.73,.94]:
            cylinder(x,-.1,.28,.04,.12,bronze,vertices=8)
        for i in range(8):
            a=math.pi*i/7
            beam((.59+math.cos(a)*.26,-.1+math.sin(a)*.30,.90),
                 (.59+math.cos(a)*.26,-.1+math.sin(a)*.30,1.02),.01,bronze)
        rail((-.83,-.55,.13),(.42,-.55,.13),segments=12,height=.14)
