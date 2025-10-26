<?xml version="1.0" encoding="utf-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns="urn:schemas-microsoft-com:office:excel"
  xmlns:s="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
  targetNamespace="urn:schemas-microsoft-com:office:excel" elementFormDefault="qualified"
  attributeFormDefault="unqualified">
  <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
    schemaLocation="shared-commonSimpleTypes.xsd"/>
  <xsd:element name="ClientData" type="CT_ClientData"/>
  <xsd:complexType name="CT_ClientData">
    <xsd:choice minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="MoveWithCells" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="SizeWithCells" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="Anchor" type="xsd:string"/>
      <xsd:element name="Locked" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="DefaultSize" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="PrintObject" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="Disabled" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="AutoFill" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="AutoLine" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="AutoPict" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="FmlaMacro" type="xsd:string"/>
      <xsd:element name="TextHAlign" type="xsd:string"/>
      <xsd:element name="TextVAlign" type="xsd:string"/>
      <xsd:element name="LockText" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="JustLastX" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="SecretEdit" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="Default" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="Help" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="Cancel" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="Dismiss" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="Accel" type="xsd:integer"/>
      <xsd:element name="Accel2" type="xsd:integer"/>
      <xsd:element name="Row" type="xsd:integer"/>
      <xsd:element name="Column" type="xsd:integer"/>
      <xsd:element name="Visible" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="RowHidden" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="ColHidden" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="VTEdit" type="xsd:integer"/>
      <xsd:element name="MultiLine" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="VScroll" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="ValidIds" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="FmlaRange" type="xsd:string"/>
      <xsd:element name="WidthMin" type="xsd:integer"/>
      <xsd:element name="Sel" type="xsd:integer"/>
      <xsd:element name="NoThreeD2" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="SelType" type="xsd:string"/>
      <xsd:element name="MultiSel" type="xsd:string"/>
      <xsd:element name="LCT" type="xsd:string"/>
      <xsd:element name="ListItem" type="xsd:string"/>
      <xsd:element name="DropStyle" type="xsd:string"/>
      <xsd:element name="Colored" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="DropLines" type="xsd:integer"/>
      <xsd:element name="Checked" type="xsd:integer"/>
      <xsd:element name="FmlaLink" type="xsd:string"/>
      <xsd:element name="FmlaPict" type="xsd:string"/>
      <xsd:element name="NoThreeD" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="FirstButton" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="FmlaGroup" type="xsd:string"/>
      <xsd:element name="Val" type="xsd:integer"/>
      <xsd:element name="Min" type="xsd:integer"/>
      <xsd:element name="Max" type="xsd:integer"/>
      <xsd:element name="Inc" type="xsd:integer"/>
      <xsd:element name="Page" type="xsd:integer"/>
      <xsd:element name="Horiz" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="Dx" type="xsd:integer"/>
      <xsd:element name="MapOCX" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="CF" type="ST_CF"/>
      <xsd:element name="Camera" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="RecalcAlways" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="AutoScale" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="DDE" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="UIObj" type="s:ST_TrueFalseBlank"/>
      <xsd:element name="ScriptText" type="xsd:string"/>
      <xsd:element name="ScriptExtended" type="xsd:string"/>
      <xsd:element name="ScriptLanguage" type="xsd:nonNegativeInteger"/>
      <xsd:element name="ScriptLocation" type="xsd:nonNegativeInteger"/>
      <xsd:element name="FmlaTxbx" type="xsd:string"/>
    </xsd:choice>
    <xsd:attribute name="ObjectType" type="ST_ObjectType" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_CF">
    <xsd:restriction base="xsd:string"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ObjectType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="Button"/>
      <xsd:enumeration value="Checkbox"/>
      <xsd:enumeration value="Dialog"/>
      <xsd:enumeration value="Drop"/>
      <xsd:enumeration value="Edit"/>
      <xsd:enumeration value="GBox"/>
      <xsd:enumeration value="Label"/>
      <xsd:enumeration value="LineA"/>
      <xsd:enumeration value="List"/>
      <xsd:enumeration value="Movie"/>
      <xsd:enumeration value="Note"/>
      <xsd:enumeration value="Pict"/>
      <xsd:enumeration value="Radio"/>
      <xsd:enumeration value="RectA"/>
      <xsd:enumeration value="Scroll"/>
      <xsd:enumeration value="Spin"/>
      <xsd:enumeration value="Shape"/>
      <xsd:enumeration value="Group"/>
      <xsd:enumeration value="Rect"/>
    </xsd:restriction>
  </xsd:simpleType>
</xsd:schema>
