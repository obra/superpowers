<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<xsd:schema xmlns="http://schemas.openxmlformats.org/package/2006/relationships"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  targetNamespace="http://schemas.openxmlformats.org/package/2006/relationships"
  elementFormDefault="qualified" attributeFormDefault="unqualified" blockDefault="#all">

  <xsd:element name="Relationships" type="CT_Relationships"/>
  <xsd:element name="Relationship" type="CT_Relationship"/>

  <xsd:complexType name="CT_Relationships">
    <xsd:sequence>
      <xsd:element ref="Relationship" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>

  <xsd:complexType name="CT_Relationship">
    <xsd:simpleContent>
      <xsd:extension base="xsd:string">
        <xsd:attribute name="TargetMode" type="ST_TargetMode" use="optional"/>
        <xsd:attribute name="Target" type="xsd:anyURI" use="required"/>
        <xsd:attribute name="Type" type="xsd:anyURI" use="required"/>
        <xsd:attribute name="Id" type="xsd:ID" use="required"/>
      </xsd:extension>
    </xsd:simpleContent>
  </xsd:complexType>

  <xsd:simpleType name="ST_TargetMode">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="External"/>
      <xsd:enumeration value="Internal"/>
    </xsd:restriction>
  </xsd:simpleType>
</xsd:schema>
