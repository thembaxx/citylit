"""Independent art-direction layer for premium CityLit landmark stage models.

Adds small-scale form and assembly detail AFTER the site-specific sculpt passes.
It is an original interpretation, not a photogrammetric or measured replica.
Every part is exported as actual geometry; no CSS-only fake architectural detail.
"""
import math
import random

def build(name, box, cylinder, beam, material, add, bpy):
    rng = random.Random("citylit-premium-detail-2026:" + name)
    pi, tau = math.pi, math.tau
    bronze = material("Machined brass accent", (.66, .46, .22), roughness=.25, metalness=.80)
    enamel = material("Ivory enamel finish", (.89, .87, .80), roughness=.38)
    shadow = material("Deep graphite shade", (.075, .094, .097), roughness=.70)
    mullion = material("Powder coated aluminium trim", (.30, .36, .36), roughness=.31, metalness=.72)
    pane = material("Architectural window glazing", (.21, .36, .40), roughness=.08, metalness=.03)
    timber = material("Fine mahogany joinery", (.28, .18, .115), roughness=.63)
    terracotta = material("Aged roof tile finish", (.49, .245, .185), roughness=.78)
    white = material("Limestone chalk edge", (.88, .82, .74), roughness=.81)
    foliage = [
        material("Organic botanical canopy %s" % i, c, roughness=.92)
        for i, c in enumerate(((.19,.36,.20),(.29,.46,.23),(.34,.49,.26),(.22,.43,.30)))
    ]

    def strip(a, b, thickness=.009, mat=mullion):
        beam(a, b, thickness, mat)

    def window_frame(cx, front, bottom, width, height, columns=2, rows=2, trim=enamel):
        # Shadow backplate, glass, perimeter joinery and independent mullions.
        box(cx, front+.014, bottom+height/2, width*.94, .026, height*.92, shadow)
        box(cx, front-.020, bottom+height/2, width*.84, .012, height*.84, pane)
        for side in (-1, 1):
            box(cx+side*width*.5, front-.045, bottom+height/2,
                .013, .033, height+.033, trim)
        for z in (bottom, bottom+height):
            box(cx, front-.045, z, width+.027, .036, .018, trim)
        for i in range(1, columns):
            x=cx-width/2+width*i/columns
            box(x, front-.050, bottom+height/2, .012, .02, height, trim)
        for j in range(1, rows):
            z=bottom+height*j/rows
            box(cx, front-.052, z, width, .018, .013, trim)
        box(cx, front-.040, bottom-.037, width+.070, .092, .037, white)

    def hardware(x, front, floor):
        box(x, front-.016, floor+.35, .33, .04, .68, timber)
        for height in (.12,.28,.44,.60):
            box(x, front-.042, floor+height, .30, .015, .009, bronze)
        cylinder(x+.12,front-.065,floor+.36,.012,.024,bronze,vertices=12).rotation_euler.x=pi/2
        box(x,front-.05,floor+.71,.40,.075,.038,white)

    def balcony(cx, front, bottom, width=.48):
        # Individual guardrails cast actual shadows instead of being a texture.
        box(cx,front-.14,bottom-.02,width+.12,.23,.041,white)
        for i in range(9):
            x=cx-width/2 + i*width/8
            strip((x,front-.23,bottom+.02),(x,front-.23,bottom+.34),.006,mullion)
        strip((cx-width/2,front-.23,bottom+.36),(cx+width/2,front-.23,bottom+.36),.011,mullion)
        for x in (cx-width/2,cx+width/2):
            strip((x,front-.23,bottom+.03),(x,front-.23,bottom+.40),.016,mullion)

    def fixtures(cx, cy, height, radius=.025):
        # Wall mounted lamps and mounting plates.
        box(cx,cy,height,.095,.034,.12,shadow)
        cylinder(cx,cy-.037,height+.018,radius,.07,enamel,vertices=12).rotation_euler.x=pi/2
        box(cx,cy-.090,height+.017,.016,.025,.035,bronze)

    if name == "bo-kaap":
        # One staggered multi-pane window and one distinct recessed door per
        # terrace home. Flat parapets, ironwork and tiny stoops match the
        # local Cape Malay streetscape instead of a generic pitched-roof toy.
        for i,x in enumerate((-.96,-.48,0,.48,.96)):
            z0=.12+.055*(i%3)
            front=-.225
            window_frame(x-.105,front,z0+.46,.166,.245,columns=3,rows=2)
            # Weathered door, inset panels, small glazed transom and hardware.
            box(x+.115,front-.011,z0+.37,.175,.026,.66,shadow)
            box(x+.115,front-.037,z0+.36,.153,.017,.635,timber)
            for yheight in (.15,.32,.50):
                box(x+.115,front-.053,z0+yheight,.132,.014,.012,bronze)
            box(x+.115,front-.056,z0+.735,.158,.016,.082,pane)
            box(x+.115,front-.07,z0+.74,.017,.015,.080,enamel)
            cylinder(x+.167,front-.079,z0+.37,.010,.024,bronze,vertices=12).rotation_euler.x=pi/2
            # Continuous cornices, raised plaster borders and rainwater pipes.
            box(x,front-.06,z0+.84,.455,.066,.04,white)
            box(x,front-.065,z0+.97,.45,.076,.018,white)
            box(x-.214,front-.045,z0+.49,.019,.055,.70,white)
            box(x+.214,front-.045,z0+.49,.019,.055,.70,white)
            strip((x+.201,front-.10,z0+.79),(x+.201,front-.10,z0+.05),.009,mullion)
            # Iron security grilles with a separate depth from the glass.
            for col in range(4):
                gx=x-.18+col*.05
                strip((gx,front-.082,z0+.47),
                      (gx,front-.082,z0+.705),.005,mullion)
            for h in (.49,.58,.69):
                strip((x-.19,front-.082,z0+h),
                      (x-.02,front-.082,z0+h),.004,mullion)
            fixtures(x-.19,front-.10,z0+.77,.012)
            # Stoop handrails, individual stair treads, bright low walls.
            for side in (-1,1):
                sx=x+.115+side*.118
                strip((sx,-.29,z0+.23),(sx,-.52,z0-.025),.006,mullion)
                strip((sx,-.29,z0+.23),(sx,-.29,z0+.04),.007,mullion)
                strip((sx,-.52,z0+.02),(sx,-.52,z0-.08),.006,mullion)
            if i in (1,3):
                box(x-.12,front-.12,z0+.42,.22,.23,.038,white)
                for j in range(6):
                    gx=x-.215+j*.038
                    strip((gx,front-.22,z0+.43),
                          (gx,front-.22,z0+.66),.005,mullion)
                strip((x-.218,front-.22,z0+.67),
                      (x-.02,front-.22,z0+.67),.010,mullion)
        # Repeating street joints, not a flat beige texture plane.
        for i in range(45):
            x=-1.18+(i%15)*.168
            y=-.83+(i//15)*.086
            box(x,y,.063,.135,.003,.006,white)

    elif name == "bridge":
        for side in (-1,1):
            y=side*.205
            for i in range(29):
                x=-1.20+i*.085
                strip((x,y,.49),(x,y,.65),.004,mullion)
                box(x,y,.665,.028,.036,.012,white)
        for i in range(27):
            x=-1.18+i*.091
            box(x,0,.470,.048,.005,.008,enamel)
            if i%3==0:
                box(x,-.16,.470,.020,.009,.007,bronze)
        for x in (-.70,.50):
            for z in (.55,.80,1.05,1.3):
                box(x,-.16,z,.12,.018,.024,white)
        for x in (-1.0,-.5,0,.5,1.0):
            box(x,.28,.52,.045,.09,.018,bronze)

    elif name == "lighthouse":
        # Frame each polygonal lantern pane with metal and a separate interior lens.
        for i in range(16):
            a=tau*i/16
            x,y=.254*math.cos(a),.254*math.sin(a)
            strip((x,y,1.33),(x,y,1.59),.007,mullion)
        cylinder(0,0,1.46,.085,.22,bronze,vertices=32)
        cylinder(0,0,1.49,.105,.15,enamel,vertices=32)
        for i in range(12):
            a=tau*i/12
            strip((.35*math.cos(a),.35*math.sin(a),1.34),
                  (.35*math.cos(a),.35*math.sin(a),1.53),.006,mullion)
        for z in (.32,.66,1.05):
            cylinder(0,0,z,.325,.014,white,vertices=48)
        hardware(0,-.389,.10)
        for i in range(13):
            a=tau*i/13
            box(.36*math.cos(a),.36*math.sin(a),1.32,.045,.045,.024,bronze)

    elif name == "park":
        # Botanically uneven leaf clusters instead of only simple icosphere crowns.
        for x,y,scale in ((-.67,.35,.94),(.62,.34,.83),(-.72,-.32,.74),(.71,-.34,.71)):
            for branch in range(9):
                a=tau*branch/9
                for k in range(9):
                    ph=(k+1)/10
                    angle=a+math.sin(k*2.1)*.45
                    radius=(.12+.19*ph)*scale
                    px=x+math.cos(angle)*radius
                    py=y+math.sin(angle)*radius
                    pz=.42*scale+.11*math.sin(angle*2.7)+ph*.32*scale
                    leaf=add(bpy.ops.mesh.primitive_uv_sphere_add, (px,py,pz),
                             (.036*scale,.055*scale,.012*scale),
                             foliage[(branch+k)%4],segments=8,ring_count=5,radius=1)
                    leaf.rotation_euler=(.36,angle,angle*.43)
        for j in range(42):
            x=rng.uniform(-.96,.96);y=rng.uniform(-.96,.96)
            if abs(x)<.15 or (x*x+y*y)>.96:
                continue
            z=.104
            cylinder(x,y,z,.019,.060,foliage[j%4],vertices=7)
        for x in (-.32,0,.32):
            for z in (.30,.49,.66):
                strip((x,.378,z),(x,.718,z),.006,mullion)

    elif name == "dome":
        # Constitution Hill's newer Constitutional Court and the old prison
        # structures combine brick, precast screens, glazing and shaded plazas.
        for j in range(12):
            gx=-1.04+j*.061
            for z in (.25,.37,.49,.61,.73,.85):
                box(gx,-.296,z,.048,.012,.012,terracotta if j%2 else white)
        for x in (.50,.73,.95):
            window_frame(x,-.257,.40,.15,.27,columns=3,rows=3,trim=mullion)
            box(x,-.28,.76,.19,.08,.027,white)
        # Modern structural glazing is framed at smaller spacing than the
        # structural fins, including the horizontal shadows between floors.
        for z in (.38,.52,.70,.88,1.05,1.24,1.42):
            box(.06,-.155,z,.56,.050,.015,mullion)
        for x in (-.17,-.07,.03,.13,.23):
            strip((x,-.15,.23),(x,-.15,1.57),.007,mullion)
        box(.06,-.22,1.70,.69,.46,.044,white)
        # Portico joinery and low standing public realm hardware.
        for x in (-.79,-.56,-.33,-.10):
            cylinder(x,-.55,.77,.060,.032,white,vertices=20)
            cylinder(x,-.55,.13,.069,.028,white,vertices=20)
        for x in (-.82,-.56,-.30,.02,.29,.55,.81):
            box(x,-.75,.09,.064,.17,.040,white)
        for x in (-.95,.98):
            fixtures(x,-.31,.77,.021)

    elif name == "tower":
        # Durban City Hall stone cornices and copper-ribbed central dome.
        for x in (-.88,-.58,-.29,0,.29,.58,.88):
            window_frame(x,-.329,.35,.135,.28,columns=2,rows=3)
            box(x,-.40,.79,.18,.10,.024,white)
        for side in (-1,1):
            for z in (.95,1.04,1.13):
                box(side*.94,.11,z,.27,.84,.018,white)
            fixtures(side*1.03,-.38,.69,.020)
        # Fluted free-standing portico columns and stepped capitals.
        for x in (-.74,-.45,-.15,.15,.45,.74):
            for side in (-1,1):
                strip((x+side*.022,-.499,.18),
                      (x+side*.022,-.499,.76),.006,white)
            cylinder(x,-.46,.79,.067,.040,white,vertices=24)
            cylinder(x,-.46,.16,.061,.032,white,vertices=24)
        for i in range(7):
            z=.90+i*.023
            box(0,-.635,z,1.91-i*.16,.037,.011,white)
        # Vertical copper seams and lantern frame on the domed roof.
        for i in range(24):
            a=tau*i/24
            strip((.38*math.cos(a),.11+.38*math.sin(a),1.40),
                  (.09*math.cos(a),.11+.09*math.sin(a),1.90),
                  .005,bronze)
        for i in range(16):
            a=tau*i/16
            x,y=.315*math.cos(a),.11+.315*math.sin(a)
            cylinder(x,y,1.20,.025,.28,white,vertices=16)
        box(0,-.63,.86,1.88,.06,.026,white)

    elif name == "arch":
        for i in range(13):
            x=-.67+i*.112
            box(x,-.273,1.38,.07,.008,.035,white)
        for side in (-1,1):
            x=side*.48
            for z in (.22,.36,.54,.82):
                box(x,-.20,z,.31,.026,.020,white)
            fixtures(x,-.235,.86,.019)
        for j in range(8):
            x=-.42+j*.12
            box(x,-.35,.068,.09,.15,.018,white)

    elif name == "fort":
        for i in range(5):
            angle=tau*i/5+.32
            x,y=1.07*math.cos(angle),.86*math.sin(angle)
            for j in range(5):
                a=angle+j*tau/32
                box(x+.10*math.cos(a),y+.10*math.sin(a),.78,.041,.044,.065,white)
        for j in range(70):
            x=rng.uniform(-.59,.59);y=rng.uniform(-.53,.53)
            box(x,y,.119,.047,.042,.008,white if j%4 else terracotta)
        hardware(0,-.845,.12)
        for z in (.24,.43,.64):
            box(0,-.865,z,.44,.024,.016,bronze)

    elif name == "cooling-towers":
        for cx in (-.60,.60):
            # Dense radial rim assembly and vertical access ladder.
            for i in range(48):
                a=tau*i/48
                x,y=cx+.54*math.cos(a),.54*math.sin(a)
                strip((x,y,1.67),(x,y,1.79),.005,mullion)
            for j in range(26):
                z=.12+j*.055
                r=.37+.21*((z-.95)/.87)**2
                y=-r-.012
                if j%2==0:
                    strip((cx-.045,y,z),(cx+.045,y,z),.004,bronze)
                if j<25:
                    strip((cx-.045,y,z),(cx-.045,y,z+.055),.004,mullion)
                    strip((cx+.045,y,z),(cx+.045,y,z+.055),.004,mullion)
            for z in (.23,.41,.62,.85,1.1,1.35,1.59):
                for side in (-1,1):
                    a=side*pi/2
                    x=cx+rng.uniform(-.025,.025)
                    box(x,math.sin(a)*(.43+.02*math.sin(z)),z,
                        .018,.010,.09,enamel)
        for i in range(5):
            x=-1.06+i*.5
            box(x,-.61,.18,.18,.09,.15,shadow)
            box(x,-.65,.25,.13,.04,.018,bronze)

    elif name == "aquarium":
        for x in (.43,.61,.79,.97):
            for i in range(13):
                a=pi*i/12
                y=-.11+.34*math.cos(a)
                z=.25+.40*math.sin(a)
                box(x,y,z,.010,.019,.014,pane)
        for x in (-1.03,-.72,-.42,-.12,.14):
            fixtures(x,-.17,.52,.017)
        for i in range(25):
            x=-.85+(i%9)*.14
            y=-.085+(i//9)*.11
            z=.31+.025*math.sin(i*1.6)
            cylinder(x,y,z,.012,.030,bronze,vertices=8)
        for x in (-.85,-.45,-.05):
            window_frame(x,-.045,.25,.21,.28,columns=3,rows=2)

    return True
