<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns="http://schemas.openxmlformats.org/package/2006/digital-signature"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  targetNamespace="http://schemas.openxmlformats.org/package/2006/digital-signature"
  elementFormDefault="qualified" attributeFormDefault="unqualified" blockDefault="#all">

  <xsd:element name="SignatureTime" type="CT_SignatureTime"/>
  <xsd:element name="RelationshipReference" type="CT_RelationshipReference"/>
  <xsd:element name="RelationshipsGroupReference" type="CT_RelationshipsGroupReference"/>

  <xsd:complexType name="CT_SignatureTime">
    <xsd:sequence>
      <xsd:element name="Format" type="ST_Format"/>
      <xsd:element name="Value" type="ST_Value"/>
    </xsd:sequence>
  </xsd:complexType>

  <xsd:complexType name="CT_RelationshipReference">
    <xsd:simpleContent>
      <xsd:extension base="xsd:string">
        <xsd:attribute name="SourceId" type="xsd:string" use="required"/>
      </xsd:extension>
    </xsd:simpleContent>
  </xsd:complexType>

  <xsd:complexType name="CT_RelationshipsGroupReference">
    <xsd:simpleContent>
      <xsd:extension base="xsd:string">
        <xsd:attribute name="SourceType" type="xsd:anyURI" use="required"/>
      </xsd:extension>
    </xsd:simpleContent>
  </xsd:complexType>

  <xsd:simpleType name="ST_Format">
    <xsd:restriction base="xsd:string">
      <xsd:pattern
        value="(YYYY)|(YYYY-MM)|(YYYY-MM-DD)|(YYYY-MM-DDThh:mmTZD)|(YYYY-MM-DDThh:mm:ssTZD)|(YYYY-MM-DDThh:mm:ss.sTZD)"
      />
    </xsd:restriction>
  </xsd:simpleType>

  <xsd:simpleType name="ST_Value">
    <xsd:restriction base="xsd:string">
      <xsd:pattern
        value="(([0-9][0-9][0-9][0-9]))|(([0-9][0-9][0-9][0-9])-((0[1-9])|(1(0|1|2))))|(([0-9][0-9][0-9][0-9])-((0[1-9])|(1(0|1|2)))-((0[1-9])|(1[0-9])|(2[0-9])|(3(0|1))))|(([0-9][0-9][0-9][0-9])-((0[1-9])|(1(0|1|2)))-((0[1-9])|(1[0-9])|(2[0-9])|(3(0|1)))T((0[0-9])|(1[0-9])|(2(0|1|2|3))):((0[0-9])|(1[0-9])|(2[0-9])|(3[0-9])|(4[0-9])|(5[0-9]))(((\+|-)((0[0-9])|(1[0-9])|(2(0|1|2|3))):((0[0-9])|(1[0-9])|(2[0-9])|(3[0-9])|(4[0-9])|(5[0-9])))|Z))|(([0-9][0-9][0-9][0-9])-((0[1-9])|(1(0|1|2)))-((0[1-9])|(1[0-9])|(2[0-9])|(3(0|1)))T((0[0-9])|(1[0-9])|(2(0|1|2|3))):((0[0-9])|(1[0-9])|(2[0-9])|(3[0-9])|(4[0-9])|(5[0-9])):((0[0-9])|(1[0-9])|(2[0-9])|(3[0-9])|(4[0-9])|(5[0-9]))(((\+|-)((0[0-9])|(1[0-9])|(2(0|1|2|3))):((0[0-9])|(1[0-9])|(2[0-9])|(3[0-9])|(4[0-9])|(5[0-9])))|Z))|(([0-9][0-9][0-9][0-9])-((0[1-9])|(1(0|1|2)))-((0[1-9])|(1[0-9])|(2[0-9])|(3(0|1)))T((0[0-9])|(1[0-9])|(2(0|1|2|3))):((0[0-9])|(1[0-9])|(2[0-9])|(3[0-9])|(4[0-9])|(5[0-9])):(((0[0-9])|(1[0-9])|(2[0-9])|(3[0-9])|(4[0-9])|(5[0-9]))\.[0-9])(((\+|-)((0[0-9])|(1[0-9])|(2(0|1|2|3))):((0[0-9])|(1[0-9])|(2[0-9])|(3[0-9])|(4[0-9])|(5[0-9])))|Z))"
      />
    </xsd:restriction>
  </xsd:simpleType>
</xsd:schema>
