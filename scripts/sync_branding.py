#!/usr/bin/env python3
"""Derive the native launcher vector from the canonical SVG, without raster copies."""
from pathlib import Path
import hashlib,re,xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
MASTER=ROOT/'pwa/icons/foama-mark.svg'
ANDROID='http://schemas.android.com/apk/res/android'
ET.register_namespace('android',ANDROID)
def a(name):return '{'+ANDROID+'}'+name
def source_id():return hashlib.sha256(MASTER.read_bytes()).hexdigest()[:12]
def number(value):return format(float(value),'.8g')
def shape_path(node):
    tag=node.tag.rsplit('}',1)[-1]
    if tag=='path':return node.attrib['d']
    if tag=='circle':
        x,y,r=(float(node.get(k,'0')) for k in ('cx','cy','r'))
        return f'M{number(x-r)},{number(y)}a{number(r)},{number(r)} 0 1 0 {number(2*r)},0a{number(r)},{number(r)} 0 1 0 {number(-2*r)},0z'
    if tag=='rect':
        x,y,w,h=(float(node.get(k,'0')) for k in ('x','y','width','height'));rx=min(float(node.get('rx',node.get('ry','0'))),w/2);ry=min(float(node.get('ry',str(rx))),h/2)
        if rx==0 or ry==0:return f'M{number(x)},{number(y)}h{number(w)}v{number(h)}h{number(-w)}z'
        n=number
        return f'M{n(x+rx)},{n(y)}H{n(x+w-rx)}A{n(rx)},{n(ry)} 0 0 1 {n(x+w)},{n(y+ry)}V{n(y+h-ry)}A{n(rx)},{n(ry)} 0 0 1 {n(x+w-rx)},{n(y+h)}H{n(x+rx)}A{n(rx)},{n(ry)} 0 0 1 {n(x)},{n(y+h-ry)}V{n(y+ry)}A{n(rx)},{n(ry)} 0 0 1 {n(x+rx)},{n(y)}Z'
    raise ValueError('Unsupported brand shape: '+tag)

def sync():
    source=ET.fromstring(MASTER.read_bytes());view=list(map(float,source.attrib['viewBox'].split()))
    if view[:2]!=[0,0]:raise ValueError('Brand viewBox must start at zero')
    vector=ET.Element('vector',{a('width'):'96dp',a('height'):'96dp',a('viewportWidth'):number(view[2]),a('viewportHeight'):number(view[3])})
    styles=('fill','stroke','stroke-width','stroke-linecap','stroke-linejoin')
    mapping={'fill':'fillColor','stroke':'strokeColor','stroke-width':'strokeWidth','stroke-linecap':'strokeLineCap','stroke-linejoin':'strokeLineJoin'}
    def add(node,parent,inherited):
        tag=node.tag.rsplit('}',1)[-1]
        if tag in ('title','desc'):return
        unknown=set(node.attrib)-set(styles)-{'d','x','y','width','height','rx','ry','cx','cy','r','transform'}
        if unknown:raise ValueError('Unsupported brand attributes: '+repr(sorted(unknown)))
        style={**inherited,**{k:node.attrib[k] for k in styles if k in node.attrib}}
        if tag=='g':
            transform=node.get('transform','');parts=re.findall(r'(translate|scale)\(\s*([^)]*)\)',transform)
            if transform and re.sub(r'(translate|scale)\([^)]*\)','',transform).strip():raise ValueError('Unsupported brand transform')
            for kind,values in parts:
                nums=re.split(r'[\s,]+',values.strip());attrs={}
                if not 1<=len(nums)<=2:raise ValueError('Invalid brand transform')
                if kind=='translate':attrs={a('translateX'):number(nums[0]),a('translateY'):number(nums[1] if len(nums)>1 else 0)}
                else:attrs={a('scaleX'):number(nums[0]),a('scaleY'):number(nums[1] if len(nums)>1 else nums[0])}
                parent=ET.SubElement(parent,'group',attrs)
            for child in node:add(child,parent,style)
        else:
            attrs={a('pathData'):shape_path(node)}
            for key,value in style.items():attrs[a(mapping[key])]='#00000000' if value=='none' else value
            ET.SubElement(parent,'path',attrs)
    for node in source:add(node,vector,{'fill':'#000000'})
    ET.indent(vector,space='    ')
    target=ROOT/'wear/app/src/main/res/drawable/app_icon.xml'
    target.write_text('<!-- Generated from pwa/icons/foama-mark.svg; SHA-256 '+source_id()+' -->\n'+ET.tostring(vector,encoding='unicode')+'\n')
    print('Native brand vector synced:',source_id())

if __name__=='__main__':sync()
