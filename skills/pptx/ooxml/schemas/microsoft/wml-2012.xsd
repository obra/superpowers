 <xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:w12="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:s="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes" elementFormDefault="qualified" attributeFormDefault="qualified" blockDefault="#all" xmlns="http://schemas.microsoft.com/office/word/2012/wordml" targetNamespace="http://schemas.microsoft.com/office/word/2012/wordml">
   <xsd:import id="w12" namespace="http://schemas.openxmlformats.org/wordprocessingml/2006/main" schemaLocation="../ISO-IEC29500-4_2016/wml.xsd"/>
   <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes" schemaLocation="../ISO-IEC29500-4_2016/shared-commonSimpleTypes.xsd"/>
   <xsd:element name="color" type="w12:CT_Color"/>
   <xsd:simpleType name="ST_SdtAppearance">
     <xsd:restriction base="xsd:string">
       <xsd:enumeration value="boundingBox"/>
       <xsd:enumeration value="tags"/>
       <xsd:enumeration value="hidden"/>
     </xsd:restriction>
   </xsd:simpleType>
   <xsd:element name="dataBinding" type="w12:CT_DataBinding"/>
   <xsd:complexType name="CT_SdtAppearance">
     <xsd:attribute name="val" type="ST_SdtAppearance"/>
   </xsd:complexType>
   <xsd:element name="appearance" type="CT_SdtAppearance"/>
   <xsd:complexType name="CT_CommentsEx">
     <xsd:sequence>
       <xsd:element name="commentEx" type="CT_CommentEx" minOccurs="0" maxOccurs="unbounded"/>
     </xsd:sequence>
   </xsd:complexType>
   <xsd:complexType name="CT_CommentEx">
     <xsd:attribute name="paraId" type="w12:ST_LongHexNumber" use="required"/>
     <xsd:attribute name="paraIdParent" type="w12:ST_LongHexNumber" use="optional"/>
     <xsd:attribute name="done" type="s:ST_OnOff" use="optional"/>
   </xsd:complexType>
   <xsd:element name="commentsEx" type="CT_CommentsEx"/>
   <xsd:complexType name="CT_People">
     <xsd:sequence>
       <xsd:element name="person" type="CT_Person" minOccurs="0" maxOccurs="unbounded"/>
     </xsd:sequence>
   </xsd:complexType>
   <xsd:complexType name="CT_PresenceInfo">
     <xsd:attribute name="providerId" type="xsd:string" use="required"/>
     <xsd:attribute name="userId" type="xsd:string" use="required"/>
   </xsd:complexType>
   <xsd:complexType name="CT_Person">
     <xsd:sequence>
       <xsd:element name="presenceInfo" type="CT_PresenceInfo" minOccurs="0" maxOccurs="1"/>
     </xsd:sequence>
     <xsd:attribute name="author" type="s:ST_String" use="required"/>
   </xsd:complexType>
   <xsd:element name="people" type="CT_People"/>
   <xsd:complexType name="CT_SdtRepeatedSection">
     <xsd:sequence>
       <xsd:element name="sectionTitle" type="w12:CT_String" minOccurs="0"/>
       <xsd:element name="doNotAllowInsertDeleteSection" type="w12:CT_OnOff" minOccurs="0"/>
     </xsd:sequence>
   </xsd:complexType>
   <xsd:simpleType name="ST_Guid">
     <xsd:restriction base="xsd:token">
       <xsd:pattern value="\{[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\}"/>
     </xsd:restriction>
   </xsd:simpleType>
   <xsd:complexType name="CT_Guid">
     <xsd:attribute name="val" type="ST_Guid"/>
   </xsd:complexType>
   <xsd:element name="repeatingSection" type="CT_SdtRepeatedSection"/>
   <xsd:element name="repeatingSectionItem" type="w12:CT_Empty"/>
   <xsd:element name="chartTrackingRefBased" type="w12:CT_OnOff"/>
   <xsd:element name="collapsed" type="w12:CT_OnOff"/>
   <xsd:element name="docId" type="CT_Guid"/>
   <xsd:element name="footnoteColumns" type="w12:CT_DecimalNumber"/>
   <xsd:element name="webExtensionLinked" type="w12:CT_OnOff"/>
   <xsd:element name="webExtensionCreated" type="w12:CT_OnOff"/>
   <xsd:attribute name="restartNumberingAfterBreak" type="s:ST_OnOff"/>
 </xsd:schema>
