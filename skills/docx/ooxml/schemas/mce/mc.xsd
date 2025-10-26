<?xml version="1.0" encoding="utf-8"?>
<xsd:schema xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
	attributeFormDefault="unqualified" elementFormDefault="qualified"
	targetNamespace="http://schemas.openxmlformats.org/markup-compatibility/2006"
	xmlns:xsd="http://www.w3.org/2001/XMLSchema">

  <!--
    This XSD is a modified version of the one found at:
    https://github.com/plutext/docx4j/blob/master/xsd/mce/markup-compatibility-2006-MINIMAL.xsd

    This XSD has 2 objectives:

        1. round tripping @mc:Ignorable

			<w:document
			            xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
			            xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
			            mc:Ignorable="w14 w15 wp14">

        2. enabling AlternateContent to be manipulated in certain elements
           (in the unusual case where the content model is xsd:any, it doesn't have to be explicitly added)

		See further ECMA-376, 4th Edition, Office Open XML File Formats
		Part 3 : Markup Compatibility and Extensibility
   -->

  <!--  Objective 1 -->
  <xsd:attribute name="Ignorable" type="xsd:string" />

  <!--  Objective 2 -->
	<xsd:attribute name="MustUnderstand" type="xsd:string"  />
	<xsd:attribute name="ProcessContent" type="xsd:string"  />

<!-- An AlternateContent element shall contain one or more Choice child elements, optionally followed by a
Fallback child element. If present, there shall be only one Fallback element, and it shall follow all Choice
elements. -->
	<xsd:element name="AlternateContent">
		<xsd:complexType>
			<xsd:sequence>
				<xsd:element name="Choice" minOccurs="0" maxOccurs="unbounded">
					<xsd:complexType>
						<xsd:sequence>
							<xsd:any minOccurs="0" maxOccurs="unbounded"
								processContents="strict">
							</xsd:any>
						</xsd:sequence>
						<xsd:attribute name="Requires" type="xsd:string" use="required" />
						<xsd:attribute ref="mc:Ignorable" use="optional" />
						<xsd:attribute ref="mc:MustUnderstand" use="optional" />
						<xsd:attribute ref="mc:ProcessContent" use="optional" />
					</xsd:complexType>
				</xsd:element>
				<xsd:element name="Fallback" minOccurs="0" maxOccurs="1">
					<xsd:complexType>
						<xsd:sequence>
							<xsd:any minOccurs="0" maxOccurs="unbounded"
								processContents="strict">
							</xsd:any>
						</xsd:sequence>
						<xsd:attribute ref="mc:Ignorable" use="optional" />
						<xsd:attribute ref="mc:MustUnderstand" use="optional" />
						<xsd:attribute ref="mc:ProcessContent" use="optional" />
					</xsd:complexType>
				</xsd:element>
			</xsd:sequence>
			<!-- AlternateContent elements might include the attributes Ignorable,
				MustUnderstand and ProcessContent described in this Part of ECMA-376. These
				attributes’ qualified names shall be prefixed when associated with an AlternateContent
				element. -->
			<xsd:attribute ref="mc:Ignorable" use="optional" />
			<xsd:attribute ref="mc:MustUnderstand" use="optional" />
			<xsd:attribute ref="mc:ProcessContent" use="optional" />
		</xsd:complexType>
	</xsd:element>
</xsd:schema>
