<?xml version="1.0" encoding="utf-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="urn:schemas-microsoft-com:vml"
  xmlns:pvml="urn:schemas-microsoft-com:office:powerpoint"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:s="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
  targetNamespace="urn:schemas-microsoft-com:vml" elementFormDefault="qualified"
  attributeFormDefault="unqualified">
  <xsd:import namespace="urn:schemas-microsoft-com:office:office"
    schemaLocation="vml-officeDrawing.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    schemaLocation="wml.xsd"/>
  <xsd:import namespace="urn:schemas-microsoft-com:office:word"
    schemaLocation="vml-wordprocessingDrawing.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    schemaLocation="shared-relationshipReference.xsd"/>
  <xsd:import namespace="urn:schemas-microsoft-com:office:excel"
    schemaLocation="vml-spreadsheetDrawing.xsd"/>
  <xsd:import namespace="urn:schemas-microsoft-com:office:powerpoint"
    schemaLocation="vml-presentationDrawing.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
    schemaLocation="shared-commonSimpleTypes.xsd"/>
  <xsd:attributeGroup name="AG_Id">
    <xsd:attribute name="id" type="xsd:string" use="optional"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_Style">
    <xsd:attribute name="style" type="xsd:string" use="optional"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_Type">
    <xsd:attribute name="type" type="xsd:string" use="optional"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_Adj">
    <xsd:attribute name="adj" type="xsd:string" use="optional"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_Path">
    <xsd:attribute name="path" type="xsd:string" use="optional"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_Fill">
    <xsd:attribute name="filled" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="fillcolor" type="s:ST_ColorType" use="optional"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_Chromakey">
    <xsd:attribute name="chromakey" type="s:ST_ColorType" use="optional"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_Ext">
    <xsd:attribute name="ext" form="qualified" type="ST_Ext"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_CoreAttributes">
    <xsd:attributeGroup ref="AG_Id"/>
    <xsd:attributeGroup ref="AG_Style"/>
    <xsd:attribute name="href" type="xsd:string" use="optional"/>
    <xsd:attribute name="target" type="xsd:string" use="optional"/>
    <xsd:attribute name="class" type="xsd:string" use="optional"/>
    <xsd:attribute name="title" type="xsd:string" use="optional"/>
    <xsd:attribute name="alt" type="xsd:string" use="optional"/>
    <xsd:attribute name="coordsize" type="xsd:string" use="optional"/>
    <xsd:attribute name="coordorigin" type="xsd:string" use="optional"/>
    <xsd:attribute name="wrapcoords" type="xsd:string" use="optional"/>
    <xsd:attribute name="print" type="s:ST_TrueFalse" use="optional"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_ShapeAttributes">
    <xsd:attributeGroup ref="AG_Chromakey"/>
    <xsd:attributeGroup ref="AG_Fill"/>
    <xsd:attribute name="opacity" type="xsd:string" use="optional"/>
    <xsd:attribute name="stroked" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="strokecolor" type="s:ST_ColorType" use="optional"/>
    <xsd:attribute name="strokeweight" type="xsd:string" use="optional"/>
    <xsd:attribute name="insetpen" type="s:ST_TrueFalse" use="optional"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_OfficeCoreAttributes">
    <xsd:attribute ref="o:spid"/>
    <xsd:attribute ref="o:oned"/>
    <xsd:attribute ref="o:regroupid"/>
    <xsd:attribute ref="o:doubleclicknotify"/>
    <xsd:attribute ref="o:button"/>
    <xsd:attribute ref="o:userhidden"/>
    <xsd:attribute ref="o:bullet"/>
    <xsd:attribute ref="o:hr"/>
    <xsd:attribute ref="o:hrstd"/>
    <xsd:attribute ref="o:hrnoshade"/>
    <xsd:attribute ref="o:hrpct"/>
    <xsd:attribute ref="o:hralign"/>
    <xsd:attribute ref="o:allowincell"/>
    <xsd:attribute ref="o:allowoverlap"/>
    <xsd:attribute ref="o:userdrawn"/>
    <xsd:attribute ref="o:bordertopcolor"/>
    <xsd:attribute ref="o:borderleftcolor"/>
    <xsd:attribute ref="o:borderbottomcolor"/>
    <xsd:attribute ref="o:borderrightcolor"/>
    <xsd:attribute ref="o:dgmlayout"/>
    <xsd:attribute ref="o:dgmnodekind"/>
    <xsd:attribute ref="o:dgmlayoutmru"/>
    <xsd:attribute ref="o:insetmode"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_OfficeShapeAttributes">
    <xsd:attribute ref="o:spt"/>
    <xsd:attribute ref="o:connectortype"/>
    <xsd:attribute ref="o:bwmode"/>
    <xsd:attribute ref="o:bwpure"/>
    <xsd:attribute ref="o:bwnormal"/>
    <xsd:attribute ref="o:forcedash"/>
    <xsd:attribute ref="o:oleicon"/>
    <xsd:attribute ref="o:ole"/>
    <xsd:attribute ref="o:preferrelative"/>
    <xsd:attribute ref="o:cliptowrap"/>
    <xsd:attribute ref="o:clip"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_AllCoreAttributes">
    <xsd:attributeGroup ref="AG_CoreAttributes"/>
    <xsd:attributeGroup ref="AG_OfficeCoreAttributes"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_AllShapeAttributes">
    <xsd:attributeGroup ref="AG_ShapeAttributes"/>
    <xsd:attributeGroup ref="AG_OfficeShapeAttributes"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_ImageAttributes">
    <xsd:attribute name="src" type="xsd:string" use="optional"/>
    <xsd:attribute name="cropleft" type="xsd:string" use="optional"/>
    <xsd:attribute name="croptop" type="xsd:string" use="optional"/>
    <xsd:attribute name="cropright" type="xsd:string" use="optional"/>
    <xsd:attribute name="cropbottom" type="xsd:string" use="optional"/>
    <xsd:attribute name="gain" type="xsd:string" use="optional"/>
    <xsd:attribute name="blacklevel" type="xsd:string" use="optional"/>
    <xsd:attribute name="gamma" type="xsd:string" use="optional"/>
    <xsd:attribute name="grayscale" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="bilevel" type="s:ST_TrueFalse" use="optional"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_StrokeAttributes">
    <xsd:attribute name="on" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="weight" type="xsd:string" use="optional"/>
    <xsd:attribute name="color" type="s:ST_ColorType" use="optional"/>
    <xsd:attribute name="opacity" type="xsd:string" use="optional"/>
    <xsd:attribute name="linestyle" type="ST_StrokeLineStyle" use="optional"/>
    <xsd:attribute name="miterlimit" type="xsd:decimal" use="optional"/>
    <xsd:attribute name="joinstyle" type="ST_StrokeJoinStyle" use="optional"/>
    <xsd:attribute name="endcap" type="ST_StrokeEndCap" use="optional"/>
    <xsd:attribute name="dashstyle" type="xsd:string" use="optional"/>
    <xsd:attribute name="filltype" type="ST_FillType" use="optional"/>
    <xsd:attribute name="src" type="xsd:string" use="optional"/>
    <xsd:attribute name="imageaspect" type="ST_ImageAspect" use="optional"/>
    <xsd:attribute name="imagesize" type="xsd:string" use="optional"/>
    <xsd:attribute name="imagealignshape" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="color2" type="s:ST_ColorType" use="optional"/>
    <xsd:attribute name="startarrow" type="ST_StrokeArrowType" use="optional"/>
    <xsd:attribute name="startarrowwidth" type="ST_StrokeArrowWidth" use="optional"/>
    <xsd:attribute name="startarrowlength" type="ST_StrokeArrowLength" use="optional"/>
    <xsd:attribute name="endarrow" type="ST_StrokeArrowType" use="optional"/>
    <xsd:attribute name="endarrowwidth" type="ST_StrokeArrowWidth" use="optional"/>
    <xsd:attribute name="endarrowlength" type="ST_StrokeArrowLength" use="optional"/>
    <xsd:attribute ref="o:href"/>
    <xsd:attribute ref="o:althref"/>
    <xsd:attribute ref="o:title"/>
    <xsd:attribute ref="o:forcedash"/>
    <xsd:attribute ref="r:id" use="optional"/>
    <xsd:attribute name="insetpen" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute ref="o:relid"/>
  </xsd:attributeGroup>
  <xsd:group name="EG_ShapeElements">
    <xsd:choice>
      <xsd:element ref="path"/>
      <xsd:element ref="formulas"/>
      <xsd:element ref="handles"/>
      <xsd:element ref="fill"/>
      <xsd:element ref="stroke"/>
      <xsd:element ref="shadow"/>
      <xsd:element ref="textbox"/>
      <xsd:element ref="textpath"/>
      <xsd:element ref="imagedata"/>
      <xsd:element ref="o:skew"/>
      <xsd:element ref="o:extrusion"/>
      <xsd:element ref="o:callout"/>
      <xsd:element ref="o:lock"/>
      <xsd:element ref="o:clippath"/>
      <xsd:element ref="o:signatureline"/>
      <xsd:element ref="w10:wrap"/>
      <xsd:element ref="w10:anchorlock"/>
      <xsd:element ref="w10:bordertop"/>
      <xsd:element ref="w10:borderbottom"/>
      <xsd:element ref="w10:borderleft"/>
      <xsd:element ref="w10:borderright"/>
      <xsd:element ref="x:ClientData" minOccurs="0"/>
      <xsd:element ref="pvml:textdata" minOccurs="0"/>
    </xsd:choice>
  </xsd:group>
  <xsd:element name="shape" type="CT_Shape"/>
  <xsd:element name="shapetype" type="CT_Shapetype"/>
  <xsd:element name="group" type="CT_Group"/>
  <xsd:element name="background" type="CT_Background"/>
  <xsd:complexType name="CT_Shape">
    <xsd:choice maxOccurs="unbounded">
      <xsd:group ref="EG_ShapeElements"/>
      <xsd:element ref="o:ink"/>
      <xsd:element ref="pvml:iscomment"/>
      <xsd:element ref="o:equationxml"/>
    </xsd:choice>
    <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
    <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
    <xsd:attributeGroup ref="AG_Type"/>
    <xsd:attributeGroup ref="AG_Adj"/>
    <xsd:attributeGroup ref="AG_Path"/>
    <xsd:attribute ref="o:gfxdata"/>
    <xsd:attribute name="equationxml" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Shapetype">
    <xsd:sequence>
      <xsd:group ref="EG_ShapeElements" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element ref="o:complex" minOccurs="0"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
    <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
    <xsd:attributeGroup ref="AG_Adj"/>
    <xsd:attributeGroup ref="AG_Path"/>
    <xsd:attribute ref="o:master"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Group">
    <xsd:choice maxOccurs="unbounded">
      <xsd:group ref="EG_ShapeElements"/>
      <xsd:element ref="group"/>
      <xsd:element ref="shape"/>
      <xsd:element ref="shapetype"/>
      <xsd:element ref="arc"/>
      <xsd:element ref="curve"/>
      <xsd:element ref="image"/>
      <xsd:element ref="line"/>
      <xsd:element ref="oval"/>
      <xsd:element ref="polyline"/>
      <xsd:element ref="rect"/>
      <xsd:element ref="roundrect"/>
      <xsd:element ref="o:diagram"/>
    </xsd:choice>
    <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
    <xsd:attributeGroup ref="AG_Fill"/>
    <xsd:attribute name="editas" type="ST_EditAs" use="optional"/>
    <xsd:attribute ref="o:tableproperties"/>
    <xsd:attribute ref="o:tablelimits"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Background">
    <xsd:sequence>
      <xsd:element ref="fill" minOccurs="0"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_Id"/>
    <xsd:attributeGroup ref="AG_Fill"/>
    <xsd:attribute ref="o:bwmode"/>
    <xsd:attribute ref="o:bwpure"/>
    <xsd:attribute ref="o:bwnormal"/>
    <xsd:attribute ref="o:targetscreensize"/>
  </xsd:complexType>
  <xsd:element name="fill" type="CT_Fill"/>
  <xsd:element name="formulas" type="CT_Formulas"/>
  <xsd:element name="handles" type="CT_Handles"/>
  <xsd:element name="imagedata" type="CT_ImageData"/>
  <xsd:element name="path" type="CT_Path"/>
  <xsd:element name="textbox" type="CT_Textbox"/>
  <xsd:element name="shadow" type="CT_Shadow"/>
  <xsd:element name="stroke" type="CT_Stroke"/>
  <xsd:element name="textpath" type="CT_TextPath"/>
  <xsd:complexType name="CT_Fill">
    <xsd:sequence>
      <xsd:element ref="o:fill" minOccurs="0"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_Id"/>
    <xsd:attribute name="type" type="ST_FillType" use="optional"/>
    <xsd:attribute name="on" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="color" type="s:ST_ColorType" use="optional"/>
    <xsd:attribute name="opacity" type="xsd:string" use="optional"/>
    <xsd:attribute name="color2" type="s:ST_ColorType" use="optional"/>
    <xsd:attribute name="src" type="xsd:string" use="optional"/>
    <xsd:attribute ref="o:href"/>
    <xsd:attribute ref="o:althref"/>
    <xsd:attribute name="size" type="xsd:string" use="optional"/>
    <xsd:attribute name="origin" type="xsd:string" use="optional"/>
    <xsd:attribute name="position" type="xsd:string" use="optional"/>
    <xsd:attribute name="aspect" type="ST_ImageAspect" use="optional"/>
    <xsd:attribute name="colors" type="xsd:string" use="optional"/>
    <xsd:attribute name="angle" type="xsd:decimal" use="optional"/>
    <xsd:attribute name="alignshape" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="focus" type="xsd:string" use="optional"/>
    <xsd:attribute name="focussize" type="xsd:string" use="optional"/>
    <xsd:attribute name="focusposition" type="xsd:string" use="optional"/>
    <xsd:attribute name="method" type="ST_FillMethod" use="optional"/>
    <xsd:attribute ref="o:detectmouseclick"/>
    <xsd:attribute ref="o:title"/>
    <xsd:attribute ref="o:opacity2"/>
    <xsd:attribute name="recolor" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="rotate" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute ref="r:id" use="optional"/>
    <xsd:attribute ref="o:relid" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Formulas">
    <xsd:sequence>
      <xsd:element name="f" type="CT_F" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_F">
    <xsd:attribute name="eqn" type="xsd:string"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Handles">
    <xsd:sequence>
      <xsd:element name="h" type="CT_H" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_H">
    <xsd:attribute name="position" type="xsd:string"/>
    <xsd:attribute name="polar" type="xsd:string"/>
    <xsd:attribute name="map" type="xsd:string"/>
    <xsd:attribute name="invx" type="s:ST_TrueFalse"/>
    <xsd:attribute name="invy" type="s:ST_TrueFalse"/>
    <xsd:attribute name="switch" type="s:ST_TrueFalseBlank"/>
    <xsd:attribute name="xrange" type="xsd:string"/>
    <xsd:attribute name="yrange" type="xsd:string"/>
    <xsd:attribute name="radiusrange" type="xsd:string"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ImageData">
    <xsd:attributeGroup ref="AG_Id"/>
    <xsd:attributeGroup ref="AG_ImageAttributes"/>
    <xsd:attributeGroup ref="AG_Chromakey"/>
    <xsd:attribute name="embosscolor" type="s:ST_ColorType" use="optional"/>
    <xsd:attribute name="recolortarget" type="s:ST_ColorType"/>
    <xsd:attribute ref="o:href"/>
    <xsd:attribute ref="o:althref"/>
    <xsd:attribute ref="o:title"/>
    <xsd:attribute ref="o:oleid"/>
    <xsd:attribute ref="o:detectmouseclick"/>
    <xsd:attribute ref="o:movie"/>
    <xsd:attribute ref="o:relid"/>
    <xsd:attribute ref="r:id"/>
    <xsd:attribute ref="r:pict"/>
    <xsd:attribute ref="r:href"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Path">
    <xsd:attributeGroup ref="AG_Id"/>
    <xsd:attribute name="v" type="xsd:string" use="optional"/>
    <xsd:attribute name="limo" type="xsd:string" use="optional"/>
    <xsd:attribute name="textboxrect" type="xsd:string" use="optional"/>
    <xsd:attribute name="fillok" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="strokeok" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="shadowok" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="arrowok" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="gradientshapeok" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="textpathok" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="insetpenok" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute ref="o:connecttype"/>
    <xsd:attribute ref="o:connectlocs"/>
    <xsd:attribute ref="o:connectangles"/>
    <xsd:attribute ref="o:extrusionok"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Shadow">
    <xsd:attributeGroup ref="AG_Id"/>
    <xsd:attribute name="on" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="type" type="ST_ShadowType" use="optional"/>
    <xsd:attribute name="obscured" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="color" type="s:ST_ColorType" use="optional"/>
    <xsd:attribute name="opacity" type="xsd:string" use="optional"/>
    <xsd:attribute name="offset" type="xsd:string" use="optional"/>
    <xsd:attribute name="color2" type="s:ST_ColorType" use="optional"/>
    <xsd:attribute name="offset2" type="xsd:string" use="optional"/>
    <xsd:attribute name="origin" type="xsd:string" use="optional"/>
    <xsd:attribute name="matrix" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Stroke">
    <xsd:sequence>
      <xsd:element ref="o:left" minOccurs="0"/>
      <xsd:element ref="o:top" minOccurs="0"/>
      <xsd:element ref="o:right" minOccurs="0"/>
      <xsd:element ref="o:bottom" minOccurs="0"/>
      <xsd:element ref="o:column" minOccurs="0"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_Id"/>
    <xsd:attributeGroup ref="AG_StrokeAttributes"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Textbox">
    <xsd:choice>
      <xsd:element ref="w:txbxContent" minOccurs="0"/>
      <xsd:any namespace="##local" processContents="skip"/>
    </xsd:choice>
    <xsd:attributeGroup ref="AG_Id"/>
    <xsd:attributeGroup ref="AG_Style"/>
    <xsd:attribute name="inset" type="xsd:string" use="optional"/>
    <xsd:attribute ref="o:singleclick"/>
    <xsd:attribute ref="o:insetmode"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TextPath">
    <xsd:attributeGroup ref="AG_Id"/>
    <xsd:attributeGroup ref="AG_Style"/>
    <xsd:attribute name="on" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="fitshape" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="fitpath" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="trim" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="xscale" type="s:ST_TrueFalse" use="optional"/>
    <xsd:attribute name="string" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:element name="arc" type="CT_Arc"/>
  <xsd:element name="curve" type="CT_Curve"/>
  <xsd:element name="image" type="CT_Image"/>
  <xsd:element name="line" type="CT_Line"/>
  <xsd:element name="oval" type="CT_Oval"/>
  <xsd:element name="polyline" type="CT_PolyLine"/>
  <xsd:element name="rect" type="CT_Rect"/>
  <xsd:element name="roundrect" type="CT_RoundRect"/>
  <xsd:complexType name="CT_Arc">
    <xsd:sequence>
      <xsd:group ref="EG_ShapeElements" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
    <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
    <xsd:attribute name="startAngle" type="xsd:decimal" use="optional"/>
    <xsd:attribute name="endAngle" type="xsd:decimal" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Curve">
    <xsd:sequence>
      <xsd:group ref="EG_ShapeElements" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
    <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
    <xsd:attribute name="from" type="xsd:string" use="optional"/>
    <xsd:attribute name="control1" type="xsd:string" use="optional"/>
    <xsd:attribute name="control2" type="xsd:string" use="optional"/>
    <xsd:attribute name="to" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Image">
    <xsd:sequence>
      <xsd:group ref="EG_ShapeElements" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
    <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
    <xsd:attributeGroup ref="AG_ImageAttributes"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Line">
    <xsd:sequence>
      <xsd:group ref="EG_ShapeElements" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
    <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
    <xsd:attribute name="from" type="xsd:string" use="optional"/>
    <xsd:attribute name="to" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Oval">
    <xsd:choice maxOccurs="unbounded">
      <xsd:group ref="EG_ShapeElements" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
    <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
    <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PolyLine">
    <xsd:choice minOccurs="0" maxOccurs="unbounded">
      <xsd:group ref="EG_ShapeElements"/>
      <xsd:element ref="o:ink"/>
    </xsd:choice>
    <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
    <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
    <xsd:attribute name="points" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Rect">
    <xsd:choice maxOccurs="unbounded">
      <xsd:group ref="EG_ShapeElements" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
    <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
    <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RoundRect">
    <xsd:choice maxOccurs="unbounded">
      <xsd:group ref="EG_ShapeElements" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
    <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
    <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
    <xsd:attribute name="arcsize" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Ext">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="view"/>
      <xsd:enumeration value="edit"/>
      <xsd:enumeration value="backwardCompatible"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FillType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="solid"/>
      <xsd:enumeration value="gradient"/>
      <xsd:enumeration value="gradientRadial"/>
      <xsd:enumeration value="tile"/>
      <xsd:enumeration value="pattern"/>
      <xsd:enumeration value="frame"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FillMethod">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="linear"/>
      <xsd:enumeration value="sigma"/>
      <xsd:enumeration value="any"/>
      <xsd:enumeration value="linear sigma"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ShadowType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="single"/>
      <xsd:enumeration value="double"/>
      <xsd:enumeration value="emboss"/>
      <xsd:enumeration value="perspective"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_StrokeLineStyle">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="single"/>
      <xsd:enumeration value="thinThin"/>
      <xsd:enumeration value="thinThick"/>
      <xsd:enumeration value="thickThin"/>
      <xsd:enumeration value="thickBetweenThin"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_StrokeJoinStyle">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="round"/>
      <xsd:enumeration value="bevel"/>
      <xsd:enumeration value="miter"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_StrokeEndCap">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="flat"/>
      <xsd:enumeration value="square"/>
      <xsd:enumeration value="round"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_StrokeArrowLength">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="short"/>
      <xsd:enumeration value="medium"/>
      <xsd:enumeration value="long"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_StrokeArrowWidth">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="narrow"/>
      <xsd:enumeration value="medium"/>
      <xsd:enumeration value="wide"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_StrokeArrowType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="block"/>
      <xsd:enumeration value="classic"/>
      <xsd:enumeration value="oval"/>
      <xsd:enumeration value="diamond"/>
      <xsd:enumeration value="open"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ImageAspect">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="ignore"/>
      <xsd:enumeration value="atMost"/>
      <xsd:enumeration value="atLeast"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_EditAs">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="canvas"/>
      <xsd:enumeration value="orgchart"/>
      <xsd:enumeration value="radial"/>
      <xsd:enumeration value="cycle"/>
      <xsd:enumeration value="stacked"/>
      <xsd:enumeration value="venn"/>
      <xsd:enumeration value="bullseye"/>
    </xsd:restriction>
  </xsd:simpleType>
</xsd:schema>
