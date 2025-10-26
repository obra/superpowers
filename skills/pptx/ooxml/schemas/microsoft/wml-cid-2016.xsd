 <xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:w12="http://schemas.openxmlformats.org/wordprocessingml/2006/main" elementFormDefault="qualified" attributeFormDefault="qualified" blockDefault="#all" xmlns="http://schemas.microsoft.com/office/word/2016/wordml/cid" targetNamespace="http://schemas.microsoft.com/office/word/2016/wordml/cid">
   <xsd:import id="w12" namespace="http://schemas.openxmlformats.org/wordprocessingml/2006/main" schemaLocation="../ISO-IEC29500-4_2016/wml.xsd"/>
   <xsd:complexType name="CT_CommentsIds">
     <xsd:sequence>
       <xsd:element name="commentId" type="CT_CommentId" minOccurs="0" maxOccurs="unbounded"/>
     </xsd:sequence>
   </xsd:complexType>
   <xsd:complexType name="CT_CommentId">
     <xsd:attribute name="paraId" type="w12:ST_LongHexNumber" use="required"/>
     <xsd:attribute name="durableId" type="w12:ST_LongHexNumber" use="required"/>
   </xsd:complexType>
   <xsd:element name="commentsIds" type="CT_CommentsIds"/>
 </xsd:schema>
