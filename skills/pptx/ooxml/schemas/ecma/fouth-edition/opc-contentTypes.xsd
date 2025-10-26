<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<xs:schema xmlns="http://schemas.openxmlformats.org/package/2006/content-types"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  targetNamespace="http://schemas.openxmlformats.org/package/2006/content-types"
  elementFormDefault="qualified" attributeFormDefault="unqualified" blockDefault="#all">

  <xs:element name="Types" type="CT_Types"/>
  <xs:element name="Default" type="CT_Default"/>
  <xs:element name="Override" type="CT_Override"/>

  <xs:complexType name="CT_Types">
    <xs:choice minOccurs="0" maxOccurs="unbounded">
      <xs:element ref="Default"/>
      <xs:element ref="Override"/>
    </xs:choice>
  </xs:complexType>

  <xs:complexType name="CT_Default">
    <xs:attribute name="Extension" type="ST_Extension" use="required"/>
    <xs:attribute name="ContentType" type="ST_ContentType" use="required"/>
  </xs:complexType>

  <xs:complexType name="CT_Override">
    <xs:attribute name="ContentType" type="ST_ContentType" use="required"/>
    <xs:attribute name="PartName" type="xs:anyURI" use="required"/>
  </xs:complexType>

  <xs:simpleType name="ST_ContentType">
    <xs:restriction base="xs:string">
      <xs:pattern
        value="(((([\p{IsBasicLatin}-[\p{Cc}&#127;\(\)&lt;&gt;@,;:\\&quot;/\[\]\?=\{\}\s\t]])+))/((([\p{IsBasicLatin}-[\p{Cc}&#127;\(\)&lt;&gt;@,;:\\&quot;/\[\]\?=\{\}\s\t]])+))((\s+)*;(\s+)*(((([\p{IsBasicLatin}-[\p{Cc}&#127;\(\)&lt;&gt;@,;:\\&quot;/\[\]\?=\{\}\s\t]])+))=((([\p{IsBasicLatin}-[\p{Cc}&#127;\(\)&lt;&gt;@,;:\\&quot;/\[\]\?=\{\}\s\t]])+)|(&quot;(([\p{IsLatin-1Supplement}\p{IsBasicLatin}-[\p{Cc}&#127;&quot;\n\r]]|(\s+))|(\\[\p{IsBasicLatin}]))*&quot;))))*)"
      />
    </xs:restriction>
  </xs:simpleType>

  <xs:simpleType name="ST_Extension">
    <xs:restriction base="xs:string">
      <xs:pattern
        value="([!$&amp;'\(\)\*\+,:=]|(%[0-9a-fA-F][0-9a-fA-F])|[:@]|[a-zA-Z0-9\-_~])+"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>
