"""Deterministic leafy canopy and planted grass for the CityLit garden GLB.

Individual curved laminae share one mesh and four material slots, avoiding
hundreds of separate GPU draw calls. All geometry is authored locally.
"""
import math
import random
from mathutils import Vector

def build(name, beam, material, bpy):
    if name != "park":
        return False
    rng=random.Random(20261103)
    colors=((.14,.32,.17),(.34,.43,.19),(.22,.40,.25),(.40,.52,.27))
    mats=[material("Botanical lamina %d" % i,c,roughness=.89)
          for i,c in enumerate(colors)]
    bark=material("Botanical trunk and twigs",(.24,.19,.13),roughness=.96)
    grass=material("Botanical garden grass blades",(.26,.42,.18),roughness=.95)
    vertices, faces, slots=[],[],[]
    tau=math.tau

    def leaf(origin, heading, length, width, slot):
        direction=Vector(heading).normalized()
        side=direction.cross(Vector((0,0,1)))
        if side.length < .001: side=Vector((1,0,0))
        side.normalize()
        up=side.cross(direction).normalized()
        start=len(vertices)
        for t,span in ((0,0),(.24,.72),(.52,1),(.78,.67),(1,0)):
            center=Vector(origin)+direction*length*t
            center+=up*(math.sin(math.pi*t)*length*.115)
            for f in (-1,0,1):
                p=center+side*(f*width*span*.5)
                p+=up*((1-abs(f))*length*.027)
                vertices.append(tuple(p))
        for j in range(4):
            a,b=start+j*3,start+(j+1)*3
            for tri in ((a,a+1,b+1),(a,b+1,b),
                        (a+1,a+2,b+2),(a+1,b+2,b+1)):
                faces.append(tri)
                slots.append(slot)

    trees= ((-.67,.35,.94),(.62,.34,.83),(-.72,-.32,.74),(.71,-.34,.71))
    for ti,(x,y,scale) in enumerate(trees):
        for cluster in range(11):
            angle=tau*cluster/11+.31*ti
            spread=(.14+.055*rng.random())*scale
            cx=x+math.cos(angle)*spread
            cy=y+math.sin(angle)*spread
            cz=.10+(.58+.11*rng.random())*scale
            beam((x,y,.10+.35*scale),(cx,cy,cz),.0055*scale,bark)
            for k in range(29):
                origin=(cx+rng.uniform(-.105,.105)*scale,
                        cy+rng.uniform(-.095,.095)*scale,
                        cz+rng.uniform(-.11,.11)*scale)
                a=angle+rng.uniform(-1.9,1.9)
                leaf(origin,(math.cos(a),math.sin(a),rng.uniform(-.32,.64)),
                     rng.uniform(.052,.094)*scale,
                     rng.uniform(.018,.037)*scale,(ti+cluster+k//5)%4)

    canopy=bpy.data.meshes.new("Curved botanical leaf laminae")
    canopy.from_pydata(vertices,[],faces)
    canopy.update()
    for mat in mats: canopy.materials.append(mat)
    for face,idx in zip(canopy.polygons,slots):
        face.material_index=idx
        face.use_smooth=True
    obj=bpy.data.objects.new("Botanical individual leaf canopy",canopy)
    bpy.context.collection.objects.link(obj)

    # One mesh of tapered blades, kept away from paved paths.
    vs,fs=[],[]
    for n in range(72):
        x,y=rng.uniform(-1.04,1.04),rng.uniform(-.89,.87)
        if abs(x)<.17 or x*x+y*y>1.0 or (.28<y<.8 and abs(x)<.4):
            continue
        for k in range(7):
            a=rng.uniform(0,tau)
            direction=Vector((math.cos(a),math.sin(a),0))
            side=Vector((-direction.y,direction.x,0))
            h=rng.uniform(.046,.12)
            w=rng.uniform(.008,.016)
            lean=rng.uniform(.025,.055)
            first=len(vs)
            for t,span in ((0,1),(.52,.69),(1,0)):
                center=Vector((x,y,.102+t*h))+direction*lean*t*t
                for sign in (-1,1):
                    vs.append(tuple(center+side*w*span*sign))
            fs.extend(((first,first+1,first+3),
                       (first,first+3,first+2),
                       (first+2,first+3,first+5),
                       (first+2,first+5,first+4)))
    ground=bpy.data.meshes.new("Individual native grass blades")
    ground.from_pydata(vs,[],fs)
    ground.update()
    ground.materials.append(grass)
    bpy.context.collection.objects.link(
        bpy.data.objects.new("Botanical planted grass blades",ground)
    )
    count=len(faces)//16
    print("Botanical laminae:",count,"leaf tris:",len(faces),
          "ground blades:",len(fs)//4)
    if count<1000 or len(faces)<15000:
        raise RuntimeError("Botanical geometry unexpectedly sparse")
    return True
