<?xml version="1.0" encoding="utf-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns="http://schemas.openxmlformats.org/drawingml/2006/diagram"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:s="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
  targetNamespace="http://schemas.openxmlformats.org/drawingml/2006/diagram"
  elementFormDefault="qualified" attributeFormDefault="unqualified">
  <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    schemaLocation="shared-relationshipReference.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/drawingml/2006/main"
    schemaLocation="dml-main.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
    schemaLocation="shared-commonSimpleTypes.xsd"/>
  <xsd:complexType name="CT_CTName">
    <xsd:attribute name="lang" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="val" type="xsd:string" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CTDescription">
    <xsd:attribute name="lang" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="val" type="xsd:string" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CTCategory">
    <xsd:attribute name="type" type="xsd:anyURI" use="required"/>
    <xsd:attribute name="pri" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CTCategories">
    <xsd:sequence minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="cat" type="CT_CTCategory" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_ClrAppMethod">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="span"/>
      <xsd:enumeration value="cycle"/>
      <xsd:enumeration value="repeat"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_HueDir">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="cw"/>
      <xsd:enumeration value="ccw"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Colors">
    <xsd:sequence>
      <xsd:group ref="a:EG_ColorChoice" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="meth" type="ST_ClrAppMethod" use="optional" default="span"/>
    <xsd:attribute name="hueDir" type="ST_HueDir" use="optional" default="cw"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CTStyleLabel">
    <xsd:sequence>
      <xsd:element name="fillClrLst" type="CT_Colors" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="linClrLst" type="CT_Colors" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="effectClrLst" type="CT_Colors" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="txLinClrLst" type="CT_Colors" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="txFillClrLst" type="CT_Colors" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="txEffectClrLst" type="CT_Colors" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="xsd:string" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ColorTransform">
    <xsd:sequence>
      <xsd:element name="title" type="CT_CTName" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="desc" type="CT_CTDescription" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="catLst" type="CT_CTCategories" minOccurs="0"/>
      <xsd:element name="styleLbl" type="CT_CTStyleLabel" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="uniqueId" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="minVer" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:element name="colorsDef" type="CT_ColorTransform"/>
  <xsd:complexType name="CT_ColorTransformHeader">
    <xsd:sequence>
      <xsd:element name="title" type="CT_CTName" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="desc" type="CT_CTDescription" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="catLst" type="CT_CTCategories" minOccurs="0"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="uniqueId" type="xsd:string" use="required"/>
    <xsd:attribute name="minVer" type="xsd:string" use="optional"/>
    <xsd:attribute name="resId" type="xsd:int" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:element name="colorsDefHdr" type="CT_ColorTransformHeader"/>
  <xsd:complexType name="CT_ColorTransformHeaderLst">
    <xsd:sequence>
      <xsd:element name="colorsDefHdr" type="CT_ColorTransformHeader" minOccurs="0"
        maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="colorsDefHdrLst" type="CT_ColorTransformHeaderLst"/>
  <xsd:simpleType name="ST_PtType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="node"/>
      <xsd:enumeration value="asst"/>
      <xsd:enumeration value="doc"/>
      <xsd:enumeration value="pres"/>
      <xsd:enumeration value="parTrans"/>
      <xsd:enumeration value="sibTrans"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Pt">
    <xsd:sequence>
      <xsd:element name="prSet" type="CT_ElemPropSet" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="t" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="modelId" type="ST_ModelId" use="required"/>
    <xsd:attribute name="type" type="ST_PtType" use="optional" default="node"/>
    <xsd:attribute name="cxnId" type="ST_ModelId" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PtList">
    <xsd:sequence>
      <xsd:element name="pt" type="CT_Pt" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_CxnType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="parOf"/>
      <xsd:enumeration value="presOf"/>
      <xsd:enumeration value="presParOf"/>
      <xsd:enumeration value="unknownRelationship"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Cxn">
    <xsd:sequence>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="modelId" type="ST_ModelId" use="required"/>
    <xsd:attribute name="type" type="ST_CxnType" use="optional" default="parOf"/>
    <xsd:attribute name="srcId" type="ST_ModelId" use="required"/>
    <xsd:attribute name="destId" type="ST_ModelId" use="required"/>
    <xsd:attribute name="srcOrd" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="destOrd" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="parTransId" type="ST_ModelId" use="optional" default="0"/>
    <xsd:attribute name="sibTransId" type="ST_ModelId" use="optional" default="0"/>
    <xsd:attribute name="presId" type="xsd:string" use="optional" default=""/>
  </xsd:complexType>
  <xsd:complexType name="CT_CxnList">
    <xsd:sequence>
      <xsd:element name="cxn" type="CT_Cxn" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_DataModel">
    <xsd:sequence>
      <xsd:element name="ptLst" type="CT_PtList"/>
      <xsd:element name="cxnLst" type="CT_CxnList" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="bg" type="a:CT_BackgroundFormatting" minOccurs="0"/>
      <xsd:element name="whole" type="a:CT_WholeE2oFormatting" minOccurs="0"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="dataModel" type="CT_DataModel"/>
  <xsd:attributeGroup name="AG_IteratorAttributes">
    <xsd:attribute name="axis" type="ST_AxisTypes" use="optional" default="none"/>
    <xsd:attribute name="ptType" type="ST_ElementTypes" use="optional" default="all"/>
    <xsd:attribute name="hideLastTrans" type="ST_Booleans" use="optional" default="true"/>
    <xsd:attribute name="st" type="ST_Ints" use="optional" default="1"/>
    <xsd:attribute name="cnt" type="ST_UnsignedInts" use="optional" default="0"/>
    <xsd:attribute name="step" type="ST_Ints" use="optional" default="1"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_ConstraintAttributes">
    <xsd:attribute name="type" type="ST_ConstraintType" use="required"/>
    <xsd:attribute name="for" type="ST_ConstraintRelationship" use="optional" default="self"/>
    <xsd:attribute name="forName" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="ptType" type="ST_ElementType" use="optional" default="all"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_ConstraintRefAttributes">
    <xsd:attribute name="refType" type="ST_ConstraintType" use="optional" default="none"/>
    <xsd:attribute name="refFor" type="ST_ConstraintRelationship" use="optional" default="self"/>
    <xsd:attribute name="refForName" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="refPtType" type="ST_ElementType" use="optional" default="all"/>
  </xsd:attributeGroup>
  <xsd:complexType name="CT_Constraint">
    <xsd:sequence>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_ConstraintAttributes"/>
    <xsd:attributeGroup ref="AG_ConstraintRefAttributes"/>
    <xsd:attribute name="op" type="ST_BoolOperator" use="optional" default="none"/>
    <xsd:attribute name="val" type="xsd:double" use="optional" default="0"/>
    <xsd:attribute name="fact" type="xsd:double" use="optional" default="1"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Constraints">
    <xsd:sequence>
      <xsd:element name="constr" type="CT_Constraint" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_NumericRule">
    <xsd:sequence>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_ConstraintAttributes"/>
    <xsd:attribute name="val" type="xsd:double" use="optional" default="NaN"/>
    <xsd:attribute name="fact" type="xsd:double" use="optional" default="NaN"/>
    <xsd:attribute name="max" type="xsd:double" use="optional" default="NaN"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Rules">
    <xsd:sequence>
      <xsd:element name="rule" type="CT_NumericRule" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_PresentationOf">
    <xsd:sequence>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_IteratorAttributes"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_LayoutShapeType" final="restriction">
    <xsd:union memberTypes="a:ST_ShapeType ST_OutputShapeType"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Index1">
    <xsd:restriction base="xsd:unsignedInt">
      <xsd:minInclusive value="1"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Adj">
    <xsd:attribute name="idx" type="ST_Index1" use="required"/>
    <xsd:attribute name="val" type="xsd:double" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AdjLst">
    <xsd:sequence>
      <xsd:element name="adj" type="CT_Adj" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Shape">
    <xsd:sequence>
      <xsd:element name="adjLst" type="CT_AdjLst" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="rot" type="xsd:double" use="optional" default="0"/>
    <xsd:attribute name="type" type="ST_LayoutShapeType" use="optional" default="none"/>
    <xsd:attribute ref="r:blip" use="optional"/>
    <xsd:attribute name="zOrderOff" type="xsd:int" use="optional" default="0"/>
    <xsd:attribute name="hideGeom" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="lkTxEntry" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="blipPhldr" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Parameter">
    <xsd:attribute name="type" type="ST_ParameterId" use="required"/>
    <xsd:attribute name="val" type="ST_ParameterVal" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Algorithm">
    <xsd:sequence>
      <xsd:element name="param" type="CT_Parameter" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="type" type="ST_AlgorithmType" use="required"/>
    <xsd:attribute name="rev" type="xsd:unsignedInt" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_LayoutNode">
    <xsd:choice minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="alg" type="CT_Algorithm" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="shape" type="CT_Shape" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="presOf" type="CT_PresentationOf" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="constrLst" type="CT_Constraints" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="ruleLst" type="CT_Rules" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="varLst" type="CT_LayoutVariablePropertySet" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="forEach" type="CT_ForEach"/>
      <xsd:element name="layoutNode" type="CT_LayoutNode"/>
      <xsd:element name="choose" type="CT_Choose"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:choice>
    <xsd:attribute name="name" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="styleLbl" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="chOrder" type="ST_ChildOrderType" use="optional" default="b"/>
    <xsd:attribute name="moveWith" type="xsd:string" use="optional" default=""/>
  </xsd:complexType>
  <xsd:complexType name="CT_ForEach">
    <xsd:choice minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="alg" type="CT_Algorithm" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="shape" type="CT_Shape" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="presOf" type="CT_PresentationOf" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="constrLst" type="CT_Constraints" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="ruleLst" type="CT_Rules" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="forEach" type="CT_ForEach"/>
      <xsd:element name="layoutNode" type="CT_LayoutNode"/>
      <xsd:element name="choose" type="CT_Choose"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:choice>
    <xsd:attribute name="name" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="ref" type="xsd:string" use="optional" default=""/>
    <xsd:attributeGroup ref="AG_IteratorAttributes"/>
  </xsd:complexType>
  <xsd:complexType name="CT_When">
    <xsd:choice minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="alg" type="CT_Algorithm" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="shape" type="CT_Shape" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="presOf" type="CT_PresentationOf" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="constrLst" type="CT_Constraints" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="ruleLst" type="CT_Rules" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="forEach" type="CT_ForEach"/>
      <xsd:element name="layoutNode" type="CT_LayoutNode"/>
      <xsd:element name="choose" type="CT_Choose"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:choice>
    <xsd:attribute name="name" type="xsd:string" use="optional" default=""/>
    <xsd:attributeGroup ref="AG_IteratorAttributes"/>
    <xsd:attribute name="func" type="ST_FunctionType" use="required"/>
    <xsd:attribute name="arg" type="ST_FunctionArgument" use="optional" default="none"/>
    <xsd:attribute name="op" type="ST_FunctionOperator" use="required"/>
    <xsd:attribute name="val" type="ST_FunctionValue" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Otherwise">
    <xsd:choice minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="alg" type="CT_Algorithm" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="shape" type="CT_Shape" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="presOf" type="CT_PresentationOf" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="constrLst" type="CT_Constraints" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="ruleLst" type="CT_Rules" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="forEach" type="CT_ForEach"/>
      <xsd:element name="layoutNode" type="CT_LayoutNode"/>
      <xsd:element name="choose" type="CT_Choose"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:choice>
    <xsd:attribute name="name" type="xsd:string" use="optional" default=""/>
  </xsd:complexType>
  <xsd:complexType name="CT_Choose">
    <xsd:sequence>
      <xsd:element name="if" type="CT_When" maxOccurs="unbounded"/>
      <xsd:element name="else" type="CT_Otherwise" minOccurs="0"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="xsd:string" use="optional" default=""/>
  </xsd:complexType>
  <xsd:complexType name="CT_SampleData">
    <xsd:sequence>
      <xsd:element name="dataModel" type="CT_DataModel" minOccurs="0"/>
    </xsd:sequence>
    <xsd:attribute name="useDef" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Category">
    <xsd:attribute name="type" type="xsd:anyURI" use="required"/>
    <xsd:attribute name="pri" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Categories">
    <xsd:sequence>
      <xsd:element name="cat" type="CT_Category" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Name">
    <xsd:attribute name="lang" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="val" type="xsd:string" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Description">
    <xsd:attribute name="lang" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="val" type="xsd:string" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DiagramDefinition">
    <xsd:sequence>
      <xsd:element name="title" type="CT_Name" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="desc" type="CT_Description" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="catLst" type="CT_Categories" minOccurs="0"/>
      <xsd:element name="sampData" type="CT_SampleData" minOccurs="0"/>
      <xsd:element name="styleData" type="CT_SampleData" minOccurs="0"/>
      <xsd:element name="clrData" type="CT_SampleData" minOccurs="0"/>
      <xsd:element name="layoutNode" type="CT_LayoutNode"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="uniqueId" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="minVer" type="xsd:string" use="optional"/>
    <xsd:attribute name="defStyle" type="xsd:string" use="optional" default=""/>
  </xsd:complexType>
  <xsd:element name="layoutDef" type="CT_DiagramDefinition"/>
  <xsd:complexType name="CT_DiagramDefinitionHeader">
    <xsd:sequence>
      <xsd:element name="title" type="CT_Name" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="desc" type="CT_Description" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="catLst" type="CT_Categories" minOccurs="0"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="uniqueId" type="xsd:string" use="required"/>
    <xsd:attribute name="minVer" type="xsd:string" use="optional"/>
    <xsd:attribute name="defStyle" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="resId" type="xsd:int" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:element name="layoutDefHdr" type="CT_DiagramDefinitionHeader"/>
  <xsd:complexType name="CT_DiagramDefinitionHeaderLst">
    <xsd:sequence>
      <xsd:element name="layoutDefHdr" type="CT_DiagramDefinitionHeader" minOccurs="0"
        maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="layoutDefHdrLst" type="CT_DiagramDefinitionHeaderLst"/>
  <xsd:complexType name="CT_RelIds">
    <xsd:attribute ref="r:dm" use="required"/>
    <xsd:attribute ref="r:lo" use="required"/>
    <xsd:attribute ref="r:qs" use="required"/>
    <xsd:attribute ref="r:cs" use="required"/>
  </xsd:complexType>
  <xsd:element name="relIds" type="CT_RelIds"/>
  <xsd:simpleType name="ST_ParameterVal">
    <xsd:union
      memberTypes="ST_DiagramHorizontalAlignment ST_VerticalAlignment ST_ChildDirection ST_ChildAlignment ST_SecondaryChildAlignment ST_LinearDirection ST_SecondaryLinearDirection ST_StartingElement ST_BendPoint ST_ConnectorRouting ST_ArrowheadStyle ST_ConnectorDimension ST_RotationPath ST_CenterShapeMapping ST_NodeHorizontalAlignment ST_NodeVerticalAlignment ST_FallbackDimension ST_TextDirection ST_PyramidAccentPosition ST_PyramidAccentTextMargin ST_TextBlockDirection ST_TextAnchorHorizontal ST_TextAnchorVertical ST_DiagramTextAlignment ST_AutoTextRotation ST_GrowDirection ST_FlowDirection ST_ContinueDirection ST_Breakpoint ST_Offset ST_HierarchyAlignment xsd:int xsd:double xsd:boolean xsd:string ST_ConnectorPoint"
    />
  </xsd:simpleType>
  <xsd:simpleType name="ST_ModelId">
    <xsd:union memberTypes="xsd:int s:ST_Guid"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PrSetCustVal">
    <xsd:union memberTypes="s:ST_Percentage xsd:int"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_ElemPropSet">
    <xsd:sequence>
      <xsd:element name="presLayoutVars" type="CT_LayoutVariablePropertySet" minOccurs="0"
        maxOccurs="1"/>
      <xsd:element name="style" type="a:CT_ShapeStyle" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="presAssocID" type="ST_ModelId" use="optional"/>
    <xsd:attribute name="presName" type="xsd:string" use="optional"/>
    <xsd:attribute name="presStyleLbl" type="xsd:string" use="optional"/>
    <xsd:attribute name="presStyleIdx" type="xsd:int" use="optional"/>
    <xsd:attribute name="presStyleCnt" type="xsd:int" use="optional"/>
    <xsd:attribute name="loTypeId" type="xsd:string" use="optional"/>
    <xsd:attribute name="loCatId" type="xsd:string" use="optional"/>
    <xsd:attribute name="qsTypeId" type="xsd:string" use="optional"/>
    <xsd:attribute name="qsCatId" type="xsd:string" use="optional"/>
    <xsd:attribute name="csTypeId" type="xsd:string" use="optional"/>
    <xsd:attribute name="csCatId" type="xsd:string" use="optional"/>
    <xsd:attribute name="coherent3DOff" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="phldrT" type="xsd:string" use="optional"/>
    <xsd:attribute name="phldr" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="custAng" type="xsd:int" use="optional"/>
    <xsd:attribute name="custFlipVert" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="custFlipHor" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="custSzX" type="xsd:int" use="optional"/>
    <xsd:attribute name="custSzY" type="xsd:int" use="optional"/>
    <xsd:attribute name="custScaleX" type="ST_PrSetCustVal" use="optional"/>
    <xsd:attribute name="custScaleY" type="ST_PrSetCustVal" use="optional"/>
    <xsd:attribute name="custT" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="custLinFactX" type="ST_PrSetCustVal" use="optional"/>
    <xsd:attribute name="custLinFactY" type="ST_PrSetCustVal" use="optional"/>
    <xsd:attribute name="custLinFactNeighborX" type="ST_PrSetCustVal" use="optional"/>
    <xsd:attribute name="custLinFactNeighborY" type="ST_PrSetCustVal" use="optional"/>
    <xsd:attribute name="custRadScaleRad" type="ST_PrSetCustVal" use="optional"/>
    <xsd:attribute name="custRadScaleInc" type="ST_PrSetCustVal" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Direction" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="norm"/>
      <xsd:enumeration value="rev"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_HierBranchStyle" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="l"/>
      <xsd:enumeration value="r"/>
      <xsd:enumeration value="hang"/>
      <xsd:enumeration value="std"/>
      <xsd:enumeration value="init"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_AnimOneStr" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="one"/>
      <xsd:enumeration value="branch"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_AnimLvlStr" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="lvl"/>
      <xsd:enumeration value="ctr"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_OrgChart">
    <xsd:attribute name="val" type="xsd:boolean" default="false" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_NodeCount">
    <xsd:restriction base="xsd:int">
      <xsd:minInclusive value="-1"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_ChildMax">
    <xsd:attribute name="val" type="ST_NodeCount" default="-1" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ChildPref">
    <xsd:attribute name="val" type="ST_NodeCount" default="-1" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_BulletEnabled">
    <xsd:attribute name="val" type="xsd:boolean" default="false" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Direction">
    <xsd:attribute name="val" type="ST_Direction" default="norm" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_HierBranchStyle">
    <xsd:attribute name="val" type="ST_HierBranchStyle" default="std" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AnimOne">
    <xsd:attribute name="val" type="ST_AnimOneStr" default="one" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AnimLvl">
    <xsd:attribute name="val" type="ST_AnimLvlStr" default="none" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_ResizeHandlesStr" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="exact"/>
      <xsd:enumeration value="rel"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_ResizeHandles">
    <xsd:attribute name="val" type="ST_ResizeHandlesStr" default="rel" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_LayoutVariablePropertySet">
    <xsd:sequence>
      <xsd:element name="orgChart" type="CT_OrgChart" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="chMax" type="CT_ChildMax" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="chPref" type="CT_ChildPref" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="bulletEnabled" type="CT_BulletEnabled" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="dir" type="CT_Direction" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="hierBranch" type="CT_HierBranchStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="animOne" type="CT_AnimOne" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="animLvl" type="CT_AnimLvl" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="resizeHandles" type="CT_ResizeHandles" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_SDName">
    <xsd:attribute name="lang" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="val" type="xsd:string" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SDDescription">
    <xsd:attribute name="lang" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="val" type="xsd:string" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SDCategory">
    <xsd:attribute name="type" type="xsd:anyURI" use="required"/>
    <xsd:attribute name="pri" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SDCategories">
    <xsd:sequence minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="cat" type="CT_SDCategory" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TextProps">
    <xsd:sequence>
      <xsd:group ref="a:EG_Text3D" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_StyleLabel">
    <xsd:sequence>
      <xsd:element name="scene3d" type="a:CT_Scene3D" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sp3d" type="a:CT_Shape3D" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="txPr" type="CT_TextProps" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="style" type="a:CT_ShapeStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="xsd:string" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_StyleDefinition">
    <xsd:sequence>
      <xsd:element name="title" type="CT_SDName" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="desc" type="CT_SDDescription" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="catLst" type="CT_SDCategories" minOccurs="0"/>
      <xsd:element name="scene3d" type="a:CT_Scene3D" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="styleLbl" type="CT_StyleLabel" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="uniqueId" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="minVer" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:element name="styleDef" type="CT_StyleDefinition"/>
  <xsd:complexType name="CT_StyleDefinitionHeader">
    <xsd:sequence>
      <xsd:element name="title" type="CT_SDName" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="desc" type="CT_SDDescription" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="catLst" type="CT_SDCategories" minOccurs="0"/>
      <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="uniqueId" type="xsd:string" use="required"/>
    <xsd:attribute name="minVer" type="xsd:string" use="optional"/>
    <xsd:attribute name="resId" type="xsd:int" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:element name="styleDefHdr" type="CT_StyleDefinitionHeader"/>
  <xsd:complexType name="CT_StyleDefinitionHeaderLst">
    <xsd:sequence>
      <xsd:element name="styleDefHdr" type="CT_StyleDefinitionHeader" minOccurs="0"
        maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="styleDefHdrLst" type="CT_StyleDefinitionHeaderLst"/>
  <xsd:simpleType name="ST_AlgorithmType" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="composite"/>
      <xsd:enumeration value="conn"/>
      <xsd:enumeration value="cycle"/>
      <xsd:enumeration value="hierChild"/>
      <xsd:enumeration value="hierRoot"/>
      <xsd:enumeration value="pyra"/>
      <xsd:enumeration value="lin"/>
      <xsd:enumeration value="sp"/>
      <xsd:enumeration value="tx"/>
      <xsd:enumeration value="snake"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_AxisType" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="self"/>
      <xsd:enumeration value="ch"/>
      <xsd:enumeration value="des"/>
      <xsd:enumeration value="desOrSelf"/>
      <xsd:enumeration value="par"/>
      <xsd:enumeration value="ancst"/>
      <xsd:enumeration value="ancstOrSelf"/>
      <xsd:enumeration value="followSib"/>
      <xsd:enumeration value="precedSib"/>
      <xsd:enumeration value="follow"/>
      <xsd:enumeration value="preced"/>
      <xsd:enumeration value="root"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_AxisTypes">
    <xsd:list itemType="ST_AxisType"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_BoolOperator" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="equ"/>
      <xsd:enumeration value="gte"/>
      <xsd:enumeration value="lte"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ChildOrderType" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="b"/>
      <xsd:enumeration value="t"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ConstraintType" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="alignOff"/>
      <xsd:enumeration value="begMarg"/>
      <xsd:enumeration value="bendDist"/>
      <xsd:enumeration value="begPad"/>
      <xsd:enumeration value="b"/>
      <xsd:enumeration value="bMarg"/>
      <xsd:enumeration value="bOff"/>
      <xsd:enumeration value="ctrX"/>
      <xsd:enumeration value="ctrXOff"/>
      <xsd:enumeration value="ctrY"/>
      <xsd:enumeration value="ctrYOff"/>
      <xsd:enumeration value="connDist"/>
      <xsd:enumeration value="diam"/>
      <xsd:enumeration value="endMarg"/>
      <xsd:enumeration value="endPad"/>
      <xsd:enumeration value="h"/>
      <xsd:enumeration value="hArH"/>
      <xsd:enumeration value="hOff"/>
      <xsd:enumeration value="l"/>
      <xsd:enumeration value="lMarg"/>
      <xsd:enumeration value="lOff"/>
      <xsd:enumeration value="r"/>
      <xsd:enumeration value="rMarg"/>
      <xsd:enumeration value="rOff"/>
      <xsd:enumeration value="primFontSz"/>
      <xsd:enumeration value="pyraAcctRatio"/>
      <xsd:enumeration value="secFontSz"/>
      <xsd:enumeration value="sibSp"/>
      <xsd:enumeration value="secSibSp"/>
      <xsd:enumeration value="sp"/>
      <xsd:enumeration value="stemThick"/>
      <xsd:enumeration value="t"/>
      <xsd:enumeration value="tMarg"/>
      <xsd:enumeration value="tOff"/>
      <xsd:enumeration value="userA"/>
      <xsd:enumeration value="userB"/>
      <xsd:enumeration value="userC"/>
      <xsd:enumeration value="userD"/>
      <xsd:enumeration value="userE"/>
      <xsd:enumeration value="userF"/>
      <xsd:enumeration value="userG"/>
      <xsd:enumeration value="userH"/>
      <xsd:enumeration value="userI"/>
      <xsd:enumeration value="userJ"/>
      <xsd:enumeration value="userK"/>
      <xsd:enumeration value="userL"/>
      <xsd:enumeration value="userM"/>
      <xsd:enumeration value="userN"/>
      <xsd:enumeration value="userO"/>
      <xsd:enumeration value="userP"/>
      <xsd:enumeration value="userQ"/>
      <xsd:enumeration value="userR"/>
      <xsd:enumeration value="userS"/>
      <xsd:enumeration value="userT"/>
      <xsd:enumeration value="userU"/>
      <xsd:enumeration value="userV"/>
      <xsd:enumeration value="userW"/>
      <xsd:enumeration value="userX"/>
      <xsd:enumeration value="userY"/>
      <xsd:enumeration value="userZ"/>
      <xsd:enumeration value="w"/>
      <xsd:enumeration value="wArH"/>
      <xsd:enumeration value="wOff"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ConstraintRelationship" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="self"/>
      <xsd:enumeration value="ch"/>
      <xsd:enumeration value="des"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ElementType" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="all"/>
      <xsd:enumeration value="doc"/>
      <xsd:enumeration value="node"/>
      <xsd:enumeration value="norm"/>
      <xsd:enumeration value="nonNorm"/>
      <xsd:enumeration value="asst"/>
      <xsd:enumeration value="nonAsst"/>
      <xsd:enumeration value="parTrans"/>
      <xsd:enumeration value="pres"/>
      <xsd:enumeration value="sibTrans"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ElementTypes">
    <xsd:list itemType="ST_ElementType"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ParameterId" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="horzAlign"/>
      <xsd:enumeration value="vertAlign"/>
      <xsd:enumeration value="chDir"/>
      <xsd:enumeration value="chAlign"/>
      <xsd:enumeration value="secChAlign"/>
      <xsd:enumeration value="linDir"/>
      <xsd:enumeration value="secLinDir"/>
      <xsd:enumeration value="stElem"/>
      <xsd:enumeration value="bendPt"/>
      <xsd:enumeration value="connRout"/>
      <xsd:enumeration value="begSty"/>
      <xsd:enumeration value="endSty"/>
      <xsd:enumeration value="dim"/>
      <xsd:enumeration value="rotPath"/>
      <xsd:enumeration value="ctrShpMap"/>
      <xsd:enumeration value="nodeHorzAlign"/>
      <xsd:enumeration value="nodeVertAlign"/>
      <xsd:enumeration value="fallback"/>
      <xsd:enumeration value="txDir"/>
      <xsd:enumeration value="pyraAcctPos"/>
      <xsd:enumeration value="pyraAcctTxMar"/>
      <xsd:enumeration value="txBlDir"/>
      <xsd:enumeration value="txAnchorHorz"/>
      <xsd:enumeration value="txAnchorVert"/>
      <xsd:enumeration value="txAnchorHorzCh"/>
      <xsd:enumeration value="txAnchorVertCh"/>
      <xsd:enumeration value="parTxLTRAlign"/>
      <xsd:enumeration value="parTxRTLAlign"/>
      <xsd:enumeration value="shpTxLTRAlignCh"/>
      <xsd:enumeration value="shpTxRTLAlignCh"/>
      <xsd:enumeration value="autoTxRot"/>
      <xsd:enumeration value="grDir"/>
      <xsd:enumeration value="flowDir"/>
      <xsd:enumeration value="contDir"/>
      <xsd:enumeration value="bkpt"/>
      <xsd:enumeration value="off"/>
      <xsd:enumeration value="hierAlign"/>
      <xsd:enumeration value="bkPtFixedVal"/>
      <xsd:enumeration value="stBulletLvl"/>
      <xsd:enumeration value="stAng"/>
      <xsd:enumeration value="spanAng"/>
      <xsd:enumeration value="ar"/>
      <xsd:enumeration value="lnSpPar"/>
      <xsd:enumeration value="lnSpAfParP"/>
      <xsd:enumeration value="lnSpCh"/>
      <xsd:enumeration value="lnSpAfChP"/>
      <xsd:enumeration value="rtShortDist"/>
      <xsd:enumeration value="alignTx"/>
      <xsd:enumeration value="pyraLvlNode"/>
      <xsd:enumeration value="pyraAcctBkgdNode"/>
      <xsd:enumeration value="pyraAcctTxNode"/>
      <xsd:enumeration value="srcNode"/>
      <xsd:enumeration value="dstNode"/>
      <xsd:enumeration value="begPts"/>
      <xsd:enumeration value="endPts"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Ints">
    <xsd:list itemType="xsd:int"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_UnsignedInts">
    <xsd:list itemType="xsd:unsignedInt"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Booleans">
    <xsd:list itemType="xsd:boolean"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FunctionType" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="cnt"/>
      <xsd:enumeration value="pos"/>
      <xsd:enumeration value="revPos"/>
      <xsd:enumeration value="posEven"/>
      <xsd:enumeration value="posOdd"/>
      <xsd:enumeration value="var"/>
      <xsd:enumeration value="depth"/>
      <xsd:enumeration value="maxDepth"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FunctionOperator" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="equ"/>
      <xsd:enumeration value="neq"/>
      <xsd:enumeration value="gt"/>
      <xsd:enumeration value="lt"/>
      <xsd:enumeration value="gte"/>
      <xsd:enumeration value="lte"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_DiagramHorizontalAlignment" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="l"/>
      <xsd:enumeration value="ctr"/>
      <xsd:enumeration value="r"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_VerticalAlignment" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="t"/>
      <xsd:enumeration value="mid"/>
      <xsd:enumeration value="b"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ChildDirection" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="horz"/>
      <xsd:enumeration value="vert"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ChildAlignment" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="t"/>
      <xsd:enumeration value="b"/>
      <xsd:enumeration value="l"/>
      <xsd:enumeration value="r"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_SecondaryChildAlignment" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="t"/>
      <xsd:enumeration value="b"/>
      <xsd:enumeration value="l"/>
      <xsd:enumeration value="r"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_LinearDirection" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="fromL"/>
      <xsd:enumeration value="fromR"/>
      <xsd:enumeration value="fromT"/>
      <xsd:enumeration value="fromB"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_SecondaryLinearDirection" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="fromL"/>
      <xsd:enumeration value="fromR"/>
      <xsd:enumeration value="fromT"/>
      <xsd:enumeration value="fromB"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_StartingElement" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="node"/>
      <xsd:enumeration value="trans"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_RotationPath" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="alongPath"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_CenterShapeMapping" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="fNode"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_BendPoint" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="beg"/>
      <xsd:enumeration value="def"/>
      <xsd:enumeration value="end"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ConnectorRouting" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="stra"/>
      <xsd:enumeration value="bend"/>
      <xsd:enumeration value="curve"/>
      <xsd:enumeration value="longCurve"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ArrowheadStyle" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="auto"/>
      <xsd:enumeration value="arr"/>
      <xsd:enumeration value="noArr"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ConnectorDimension" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="1D"/>
      <xsd:enumeration value="2D"/>
      <xsd:enumeration value="cust"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ConnectorPoint" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="auto"/>
      <xsd:enumeration value="bCtr"/>
      <xsd:enumeration value="ctr"/>
      <xsd:enumeration value="midL"/>
      <xsd:enumeration value="midR"/>
      <xsd:enumeration value="tCtr"/>
      <xsd:enumeration value="bL"/>
      <xsd:enumeration value="bR"/>
      <xsd:enumeration value="tL"/>
      <xsd:enumeration value="tR"/>
      <xsd:enumeration value="radial"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_NodeHorizontalAlignment" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="l"/>
      <xsd:enumeration value="ctr"/>
      <xsd:enumeration value="r"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_NodeVerticalAlignment" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="t"/>
      <xsd:enumeration value="mid"/>
      <xsd:enumeration value="b"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FallbackDimension" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="1D"/>
      <xsd:enumeration value="2D"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextDirection" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="fromT"/>
      <xsd:enumeration value="fromB"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PyramidAccentPosition" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="bef"/>
      <xsd:enumeration value="aft"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PyramidAccentTextMargin" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="step"/>
      <xsd:enumeration value="stack"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextBlockDirection" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="horz"/>
      <xsd:enumeration value="vert"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextAnchorHorizontal" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="ctr"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextAnchorVertical" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="t"/>
      <xsd:enumeration value="mid"/>
      <xsd:enumeration value="b"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_DiagramTextAlignment" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="l"/>
      <xsd:enumeration value="ctr"/>
      <xsd:enumeration value="r"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_AutoTextRotation" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="upr"/>
      <xsd:enumeration value="grav"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_GrowDirection" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="tL"/>
      <xsd:enumeration value="tR"/>
      <xsd:enumeration value="bL"/>
      <xsd:enumeration value="bR"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FlowDirection" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="row"/>
      <xsd:enumeration value="col"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ContinueDirection" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="revDir"/>
      <xsd:enumeration value="sameDir"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Breakpoint" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="endCnv"/>
      <xsd:enumeration value="bal"/>
      <xsd:enumeration value="fixed"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Offset" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="ctr"/>
      <xsd:enumeration value="off"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_HierarchyAlignment" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="tL"/>
      <xsd:enumeration value="tR"/>
      <xsd:enumeration value="tCtrCh"/>
      <xsd:enumeration value="tCtrDes"/>
      <xsd:enumeration value="bL"/>
      <xsd:enumeration value="bR"/>
      <xsd:enumeration value="bCtrCh"/>
      <xsd:enumeration value="bCtrDes"/>
      <xsd:enumeration value="lT"/>
      <xsd:enumeration value="lB"/>
      <xsd:enumeration value="lCtrCh"/>
      <xsd:enumeration value="lCtrDes"/>
      <xsd:enumeration value="rT"/>
      <xsd:enumeration value="rB"/>
      <xsd:enumeration value="rCtrCh"/>
      <xsd:enumeration value="rCtrDes"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FunctionValue" final="restriction">
    <xsd:union
      memberTypes="xsd:int xsd:boolean ST_Direction ST_HierBranchStyle ST_AnimOneStr ST_AnimLvlStr ST_ResizeHandlesStr"
    />
  </xsd:simpleType>
  <xsd:simpleType name="ST_VariableType" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="orgChart"/>
      <xsd:enumeration value="chMax"/>
      <xsd:enumeration value="chPref"/>
      <xsd:enumeration value="bulEnabled"/>
      <xsd:enumeration value="dir"/>
      <xsd:enumeration value="hierBranch"/>
      <xsd:enumeration value="animOne"/>
      <xsd:enumeration value="animLvl"/>
      <xsd:enumeration value="resizeHandles"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FunctionArgument" final="restriction">
    <xsd:union memberTypes="ST_VariableType"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_OutputShapeType" final="restriction">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="conn"/>
    </xsd:restriction>
  </xsd:simpleType>
</xsd:schema>
