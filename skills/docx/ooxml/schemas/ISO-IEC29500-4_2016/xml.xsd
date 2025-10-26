<?xml version='1.0'?>
<xs:schema targetNamespace="http://www.w3.org/XML/1998/namespace" xmlns:xs="http://www.w3.org/2001/XMLSchema" xml:lang="en">

 <xs:annotation>
  <xs:documentation>
   See http://www.w3.org/XML/1998/namespace.html and
   http://www.w3.org/TR/REC-xml for information about this namespace.

    This schema document describes the XML namespace, in a form
    suitable for import by other schema documents.  

    Note that local names in this namespace are intended to be defined
    only by the World Wide Web Consortium or its subgroups.  The
    following names are currently defined in this namespace and should
    not be used with conflicting semantics by any Working Group,
    specification, or document instance:

    base (as an attribute name): denotes an attribute whose value
         provides a URI to be used as the base for interpreting any
         relative URIs in the scope of the element on which it
         appears; its value is inherited.  This name is reserved
         by virtue of its definition in the XML Base specification.

    lang (as an attribute name): denotes an attribute whose value
         is a language code for the natural language of the content of
         any element; its value is inherited.  This name is reserved
         by virtue of its definition in the XML specification.
  
    space (as an attribute name): denotes an attribute whose
         value is a keyword indicating what whitespace processing
         discipline is intended for the content of the element; its
         value is inherited.  This name is reserved by virtue of its
         definition in the XML specification.

    Father (in any context at all): denotes Jon Bosak, the chair of 
         the original XML Working Group.  This name is reserved by 
         the following decision of the W3C XML Plenary and 
         XML Coordination groups:

             In appreciation for his vision, leadership and dedication
             the W3C XML Plenary on this 10th day of February, 2000
             reserves for Jon Bosak in perpetuity the XML name
             xml:Father
  </xs:documentation>
 </xs:annotation>

 <xs:annotation>
  <xs:documentation>This schema defines attributes and an attribute group
        suitable for use by
        schemas wishing to allow xml:base, xml:lang or xml:space attributes
        on elements they define.

        To enable this, such a schema must import this schema
        for the XML namespace, e.g. as follows:
        &lt;schema . . .>
         . . .
         &lt;import namespace="http://www.w3.org/XML/1998/namespace"
                    schemaLocation="http://www.w3.org/2001/03/xml.xsd"/>

        Subsequently, qualified reference to any of the attributes
        or the group defined below will have the desired effect, e.g.

        &lt;type . . .>
         . . .
         &lt;attributeGroup ref="xml:specialAttrs"/>
 
         will define a type which will schema-validate an instance
         element with any of those attributes</xs:documentation>
 </xs:annotation>

 <xs:annotation>
  <xs:documentation>In keeping with the XML Schema WG's standard versioning
   policy, this schema document will persist at
   http://www.w3.org/2001/03/xml.xsd.
   At the date of issue it can also be found at
   http://www.w3.org/2001/xml.xsd.
   The schema document at that URI may however change in the future,
   in order to remain compatible with the latest version of XML Schema
   itself.  In other words, if the XML Schema namespace changes, the version
   of this document at
   http://www.w3.org/2001/xml.xsd will change
   accordingly; the version at
   http://www.w3.org/2001/03/xml.xsd will not change.
  </xs:documentation>
 </xs:annotation>

 <xs:attribute name="lang" type="xs:language">
  <xs:annotation>
   <xs:documentation>In due course, we should install the relevant ISO 2- and 3-letter
         codes as the enumerated possible values . . .</xs:documentation>
  </xs:annotation>
 </xs:attribute>

 <xs:attribute name="space" default="preserve">
  <xs:simpleType>
   <xs:restriction base="xs:NCName">
    <xs:enumeration value="default"/>
    <xs:enumeration value="preserve"/>
   </xs:restriction>
  </xs:simpleType>
 </xs:attribute>

 <xs:attribute name="base" type="xs:anyURI">
  <xs:annotation>
   <xs:documentation>See http://www.w3.org/TR/xmlbase/ for
                     information about this attribute.</xs:documentation>
  </xs:annotation>
 </xs:attribute>

 <xs:attributeGroup name="specialAttrs">
  <xs:attribute ref="xml:base"/>
  <xs:attribute ref="xml:lang"/>
  <xs:attribute ref="xml:space"/>
 </xs:attributeGroup>

</xs:schema>
