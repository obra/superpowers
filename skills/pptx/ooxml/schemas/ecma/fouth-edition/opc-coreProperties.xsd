<?xml version="1.0" encoding="UTF-8"?>
<xs:schema targetNamespace="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcterms="http://purl.org/dc/terms/" elementFormDefault="qualified" blockDefault="#all">

  <xs:import namespace="http://purl.org/dc/elements/1.1/"
    schemaLocation="http://dublincore.org/schemas/xmls/qdc/2003/04/02/dc.xsd"/>
  <xs:import namespace="http://purl.org/dc/terms/"
    schemaLocation="http://dublincore.org/schemas/xmls/qdc/2003/04/02/dcterms.xsd"/>
  <xs:import id="xml" namespace="http://www.w3.org/XML/1998/namespace"/>

  <xs:element name="coreProperties" type="CT_CoreProperties"/>

  <xs:complexType name="CT_CoreProperties">
    <xs:all>
      <xs:element name="category" minOccurs="0" maxOccurs="1" type="xs:string"/>
      <xs:element name="contentStatus" minOccurs="0" maxOccurs="1" type="xs:string"/>
      <xs:element ref="dcterms:created" minOccurs="0" maxOccurs="1"/>
      <xs:element ref="dc:creator" minOccurs="0" maxOccurs="1"/>
      <xs:element ref="dc:description" minOccurs="0" maxOccurs="1"/>
      <xs:element ref="dc:identifier" minOccurs="0" maxOccurs="1"/>
      <xs:element name="keywords" minOccurs="0" maxOccurs="1" type="CT_Keywords"/>
      <xs:element ref="dc:language" minOccurs="0" maxOccurs="1"/>
      <xs:element name="lastModifiedBy" minOccurs="0" maxOccurs="1" type="xs:string"/>
      <xs:element name="lastPrinted" minOccurs="0" maxOccurs="1" type="xs:dateTime"/>
      <xs:element ref="dcterms:modified" minOccurs="0" maxOccurs="1"/>
      <xs:element name="revision" minOccurs="0" maxOccurs="1" type="xs:string"/>
      <xs:element ref="dc:subject" minOccurs="0" maxOccurs="1"/>
      <xs:element ref="dc:title" minOccurs="0" maxOccurs="1"/>
      <xs:element name="version" minOccurs="0" maxOccurs="1" type="xs:string"/>
    </xs:all>
  </xs:complexType>

  <xs:complexType name="CT_Keywords" mixed="true">
    <xs:sequence>
      <xs:element name="value" minOccurs="0" maxOccurs="unbounded" type="CT_Keyword"/>
    </xs:sequence>
    <xs:attribute ref="xml:lang" use="optional"/>
  </xs:complexType>

  <xs:complexType name="CT_Keyword">
    <xs:simpleContent>
      <xs:extension base="xs:string">
        <xs:attribute ref="xml:lang" use="optional"/>
      </xs:extension>
    </xs:simpleContent>
  </xs:complexType>

</xs:schema>
