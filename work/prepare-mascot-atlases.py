"""Register existing sprites and mask their neutral checkerboard; no new artwork."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects, binary_closing, binary_fill_holes

root=Path(__file__).resolve().parents[1]
registrations=[]
for sheet in range(1,6):
    source=Image.open(root/f'work/mascot-source/forms-{sheet}.png').convert('RGB')
    rgb=np.asarray(source).astype(np.int16)
    # All art uses a continuous dark pixel outline; the baked checker is light neutral grey.
    seeds=(rgb.max(axis=2)<108)|((rgb.max(axis=2)-rgb.min(axis=2)>48)&(rgb.min(axis=2)<180))
    ids,count=label(seeds,np.ones((3,3)))
    sizes=np.bincount(ids.ravel());seeds&=sizes[ids]>=18
    silhouette=binary_fill_holes(binary_closing(seeds,structure=np.ones((3,3))))
    # Detect enclosed checkerboard gaps by their two-tone pattern, rather than
    # deleting all grey pixels (which would damage the silver armor).
    grey=rgb.mean(axis=2)
    neutral=(rgb.max(axis=2)-rgb.min(axis=2)<20)&(grey>118)&(grey<235)
    gaps,gap_count=label(neutral,np.ones((3,3)))
    for number,sl in enumerate(find_objects(gaps),1):
        region=gaps[sl]==number;values=grey[sl][region]
        if len(values)<45 or values.std()<19:continue
        low=values<170;high=values>185
        if low.mean()<.22 or high.mean()<.22:continue
        # A checker has repeated horizontal AND vertical sign changes; flat
        # metal highlights and outlined white plates do not.
        bits=(grey[sl]>178).astype(np.int8)
        horizontal=np.count_nonzero((bits[:,1:]!=bits[:,:-1])&region[:,1:]&region[:,:-1])
        vertical=np.count_nonzero((bits[1:,:]!=bits[:-1,:])&region[1:,:]&region[:-1,:])
        if horizontal>len(values)*.07 and vertical>len(values)*.07:
            silhouette[sl]&=~region
    ids,count=label(silhouette,np.ones((3,3)))
    slices=find_objects(ids)
    masks=[np.zeros(silhouette.shape,dtype=bool) for _ in range(16)]
    large=[]
    for number,sl in enumerate(slices,1):
        y,x=sl;part=ids[sl]==number;area=part.sum()
        if area<2000:continue
        cx=(x.start+x.stop)/2;cy=(y.start+y.stop)/2
        col=min(3,int(cx/source.width*4));row=min(3,int(cy/source.height*4));cell=row*4+col
        masks[cell][sl]|=part
        large.append((number,cell,cx,cy))
    assert len({v[1] for v in large})==16,(sheet,large)
    for number,sl in enumerate(slices,1):
        if any(v[0]==number for v in large):continue
        y,x=sl;part=ids[sl]==number
        if part.sum()<50:continue
        cx=(x.start+x.stop)/2;cy=(y.start+y.stop)/2
        _,cell,px,py=min(large,key=lambda v:(v[2]-cx)**2+(v[3]-cy)**2)
        if abs(cx-px)<160 and abs(cy-py)<160:masks[cell][sl]|=part
    atlas=Image.new('RGBA',(1536,1536))
    boxes=[]
    for cell,mask in enumerate(masks):
        yy,xx=np.where(mask);x0,x1=xx.min(),xx.max()+1;y0,y1=yy.min(),yy.max()+1
        # Preserve source pixels, add alpha, and register into isolated fixed cells.
        rgba=np.dstack([np.asarray(source)[y0:y1,x0:x1],mask[y0:y1,x0:x1].astype(np.uint8)*255])
        cutout=Image.fromarray(rgba,'RGBA')
        assert cutout.width<370 and cutout.height<370,(sheet,cell,cutout.size)
        x=cell%4*384+(384-cutout.width)//2;y=cell//4*384+352-cutout.height
        atlas.paste(cutout,(x,y));boxes.append([int(x),int(y),cutout.width,cutout.height])
    atlas.save(root/f'assets/mascot-forms-{sheet}.png')
    registrations.append(boxes)
    # Local contact sheet for visual inspection on the site's dark background.
    preview=Image.new('RGBA',atlas.size,'#070d11');preview.alpha_composite(atlas)
    preview.resize((960,960),Image.Resampling.NEAREST).save(root/f'work/mascot-mapping-{sheet}.png')
    print(f'Sheet {sheet}: 16 unique isolated sprites, transparent RGBA')
(root/'mascot-crops.js').write_text('const mascotFormCrops='+json.dumps(registrations,separators=(',',':'))+';\n')
