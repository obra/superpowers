<?xml version="1.0" encoding="utf-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns="urn:schemas-microsoft-com:office:word"
  targetNamespace="urn:schemas-microsoft-com:office:word" elementFormDefault="qualified"
  attributeFormDefault="unqualified">
  <xsd:element name="bordertop" type="CT_Border"/>
  <xsd:element name="borderleft" type="CT_Border"/>
  <xsd:element name="borderright" type="CT_Border"/>
  <xsd:element name="borderbottom" type="CT_Border"/>
  <xsd:complexType name="CT_Border">
    <xsd:attribute name="type" type="ST_BorderType" use="optional"/>
    <xsd:attribute name="width" type="xsd:positiveInteger" use="optional"/>
    <xsd:attribute name="shadow" type="ST_BorderShadow" use="optional"/>
  </xsd:complexType>
  <xsd:element name="wrap" type="CT_Wrap"/>
  <xsd:complexType name="CT_Wrap">
    <xsd:attribute name="type" type="ST_WrapType" use="optional"/>
    <xsd:attribute name="side" type="ST_WrapSide" use="optional"/>
    <xsd:attribute name="anchorx" type="ST_HorizontalAnchor" use="optional"/>
    <xsd:attribute name="anchory" type="ST_VerticalAnchor" use="optional"/>
  </xsd:complexType>
  <xsd:element name="anchorlock" type="CT_AnchorLock"/>
  <xsd:complexType name="CT_AnchorLock"/>
  <xsd:simpleType name="ST_BorderType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="single"/>
      <xsd:enumeration value="thick"/>
      <xsd:enumeration value="double"/>
      <xsd:enumeration value="hairline"/>
      <xsd:enumeration value="dot"/>
      <xsd:enumeration value="dash"/>
      <xsd:enumeration value="dotDash"/>
      <xsd:enumeration value="dashDotDot"/>
      <xsd:enumeration value="triple"/>
      <xsd:enumeration value="thinThickSmall"/>
      <xsd:enumeration value="thickThinSmall"/>
      <xsd:enumeration value="thickBetweenThinSmall"/>
      <xsd:enumeration value="thinThick"/>
      <xsd:enumeration value="thickThin"/>
      <xsd:enumeration value="thickBetweenThin"/>
      <xsd:enumeration value="thinThickLarge"/>
      <xsd:enumeration value="thickThinLarge"/>
      <xsd:enumeration value="thickBetweenThinLarge"/>
      <xsd:enumeration value="wave"/>
      <xsd:enumeration value="doubleWave"/>
      <xsd:enumeration value="dashedSmall"/>
      <xsd:enumeration value="dashDotStroked"/>
      <xsd:enumeration value="threeDEmboss"/>
      <xsd:enumeration value="threeDEngrave"/>
      <xsd:enumeration value="HTMLOutset"/>
      <xsd:enumeration value="HTMLInset"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_BorderShadow">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="t"/>
      <xsd:enumeration value="true"/>
      <xsd:enumeration value="f"/>
      <xsd:enumeration value="false"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_WrapType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="topAndBottom"/>
      <xsd:enumeration value="square"/>
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="tight"/>
      <xsd:enumeration value="through"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_WrapSide">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="both"/>
      <xsd:enumeration value="left"/>
      <xsd:enumeration value="right"/>
      <xsd:enumeration value="largest"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_HorizontalAnchor">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="margin"/>
      <xsd:enumeration value="page"/>
      <xsd:enumeration value="text"/>
      <xsd:enumeration value="char"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_VerticalAnchor">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="margin"/>
      <xsd:enumeration value="page"/>
      <xsd:enumeration value="text"/>
      <xsd:enumeration value="line"/>
    </xsd:restriction>
  </xsd:simpleType>
</xsd:schema>
