 <xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:s="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" elementFormDefault="qualified" attributeFormDefault="qualified" blockDefault="#all" xmlns="http://schemas.microsoft.com/office/word/2018/wordml/cex" targetNamespace="http://schemas.microsoft.com/office/word/2018/wordml/cex">
   <xsd:import id="w16" namespace="http://schemas.microsoft.com/office/word/2018/wordml" schemaLocation="wml-2018.xsd"/>
   <xsd:import id="w" namespace="http://schemas.openxmlformats.org/wordprocessingml/2006/main" schemaLocation="../ISO-IEC29500-4_2016/wml.xsd"/>
   <xsd:import id="s" namespace="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes" schemaLocation="../ISO-IEC29500-4_2016/shared-commonSimpleTypes.xsd"/>
   <xsd:complexType name="CT_CommentsExtensible">
     <xsd:sequence>
       <xsd:element name="commentExtensible" type="CT_CommentExtensible" minOccurs="0" maxOccurs="unbounded"/>
       <xsd:element name="extLst" type="w16:CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
     </xsd:sequence>
   </xsd:complexType>
   <xsd:complexType name="CT_CommentExtensible">
     <xsd:sequence>
       <xsd:element name="extLst" type="w16:CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
     </xsd:sequence>
     <xsd:attribute name="durableId" type="w:ST_LongHexNumber" use="required"/>
     <xsd:attribute name="dateUtc" type="w:ST_DateTime" use="optional"/>
     <xsd:attribute name="intelligentPlaceholder" type="s:ST_OnOff" use="optional"/>
   </xsd:complexType>
   <xsd:element name="commentsExtensible" type="CT_CommentsExtensible"/>
 </xsd:schema>
