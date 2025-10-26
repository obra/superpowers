<?xml version="1.0" encoding="utf-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns="http://schemas.openxmlformats.org/officeDocument/2006/bibliography"
  xmlns:s="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
  targetNamespace="http://schemas.openxmlformats.org/officeDocument/2006/bibliography"
  elementFormDefault="qualified">
  <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
    schemaLocation="shared-commonSimpleTypes.xsd"/>
  <xsd:simpleType name="ST_SourceType">
    <xsd:restriction base="s:ST_String">
      <xsd:enumeration value="ArticleInAPeriodical"/>
      <xsd:enumeration value="Book"/>
      <xsd:enumeration value="BookSection"/>
      <xsd:enumeration value="JournalArticle"/>
      <xsd:enumeration value="ConferenceProceedings"/>
      <xsd:enumeration value="Report"/>
      <xsd:enumeration value="SoundRecording"/>
      <xsd:enumeration value="Performance"/>
      <xsd:enumeration value="Art"/>
      <xsd:enumeration value="DocumentFromInternetSite"/>
      <xsd:enumeration value="InternetSite"/>
      <xsd:enumeration value="Film"/>
      <xsd:enumeration value="Interview"/>
      <xsd:enumeration value="Patent"/>
      <xsd:enumeration value="ElectronicSource"/>
      <xsd:enumeration value="Case"/>
      <xsd:enumeration value="Misc"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_NameListType">
    <xsd:sequence>
      <xsd:element name="Person" type="CT_PersonType" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_PersonType">
    <xsd:sequence>
      <xsd:element name="Last" type="s:ST_String" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="First" type="s:ST_String" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="Middle" type="s:ST_String" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_NameType">
    <xsd:sequence>
      <xsd:element name="NameList" type="CT_NameListType" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_NameOrCorporateType">
    <xsd:sequence>
      <xsd:choice minOccurs="0" maxOccurs="1">
        <xsd:element name="NameList" type="CT_NameListType" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="Corporate" minOccurs="1" maxOccurs="1" type="s:ST_String"/>
      </xsd:choice>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_AuthorType">
    <xsd:sequence>
      <xsd:choice minOccurs="0" maxOccurs="unbounded">
        <xsd:element name="Artist" type="CT_NameType"/>
        <xsd:element name="Author" type="CT_NameOrCorporateType"/>
        <xsd:element name="BookAuthor" type="CT_NameType"/>
        <xsd:element name="Compiler" type="CT_NameType"/>
        <xsd:element name="Composer" type="CT_NameType"/>
        <xsd:element name="Conductor" type="CT_NameType"/>
        <xsd:element name="Counsel" type="CT_NameType"/>
        <xsd:element name="Director" type="CT_NameType"/>
        <xsd:element name="Editor" type="CT_NameType"/>
        <xsd:element name="Interviewee" type="CT_NameType"/>
        <xsd:element name="Interviewer" type="CT_NameType"/>
        <xsd:element name="Inventor" type="CT_NameType"/>
        <xsd:element name="Performer" type="CT_NameOrCorporateType"/>
        <xsd:element name="ProducerName" type="CT_NameType"/>
        <xsd:element name="Translator" type="CT_NameType"/>
        <xsd:element name="Writer" type="CT_NameType"/>
      </xsd:choice>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_SourceType">
    <xsd:sequence>
      <xsd:choice minOccurs="0" maxOccurs="unbounded">
        <xsd:element name="AbbreviatedCaseNumber" type="s:ST_String"/>
        <xsd:element name="AlbumTitle" type="s:ST_String"/>
        <xsd:element name="Author" type="CT_AuthorType"/>
        <xsd:element name="BookTitle" type="s:ST_String"/>
        <xsd:element name="Broadcaster" type="s:ST_String"/>
        <xsd:element name="BroadcastTitle" type="s:ST_String"/>
        <xsd:element name="CaseNumber" type="s:ST_String"/>
        <xsd:element name="ChapterNumber" type="s:ST_String"/>
        <xsd:element name="City" type="s:ST_String"/>
        <xsd:element name="Comments" type="s:ST_String"/>
        <xsd:element name="ConferenceName" type="s:ST_String"/>
        <xsd:element name="CountryRegion" type="s:ST_String"/>
        <xsd:element name="Court" type="s:ST_String"/>
        <xsd:element name="Day" type="s:ST_String"/>
        <xsd:element name="DayAccessed" type="s:ST_String"/>
        <xsd:element name="Department" type="s:ST_String"/>
        <xsd:element name="Distributor" type="s:ST_String"/>
        <xsd:element name="Edition" type="s:ST_String"/>
        <xsd:element name="Guid" type="s:ST_String"/>
        <xsd:element name="Institution" type="s:ST_String"/>
        <xsd:element name="InternetSiteTitle" type="s:ST_String"/>
        <xsd:element name="Issue" type="s:ST_String"/>
        <xsd:element name="JournalName" type="s:ST_String"/>
        <xsd:element name="LCID" type="s:ST_Lang"/>
        <xsd:element name="Medium" type="s:ST_String"/>
        <xsd:element name="Month" type="s:ST_String"/>
        <xsd:element name="MonthAccessed" type="s:ST_String"/>
        <xsd:element name="NumberVolumes" type="s:ST_String"/>
        <xsd:element name="Pages" type="s:ST_String"/>
        <xsd:element name="PatentNumber" type="s:ST_String"/>
        <xsd:element name="PeriodicalTitle" type="s:ST_String"/>
        <xsd:element name="ProductionCompany" type="s:ST_String"/>
        <xsd:element name="PublicationTitle" type="s:ST_String"/>
        <xsd:element name="Publisher" type="s:ST_String"/>
        <xsd:element name="RecordingNumber" type="s:ST_String"/>
        <xsd:element name="RefOrder" type="s:ST_String"/>
        <xsd:element name="Reporter" type="s:ST_String"/>
        <xsd:element name="SourceType" type="ST_SourceType"/>
        <xsd:element name="ShortTitle" type="s:ST_String"/>
        <xsd:element name="StandardNumber" type="s:ST_String"/>
        <xsd:element name="StateProvince" type="s:ST_String"/>
        <xsd:element name="Station" type="s:ST_String"/>
        <xsd:element name="Tag" type="s:ST_String"/>
        <xsd:element name="Theater" type="s:ST_String"/>
        <xsd:element name="ThesisType" type="s:ST_String"/>
        <xsd:element name="Title" type="s:ST_String"/>
        <xsd:element name="Type" type="s:ST_String"/>
        <xsd:element name="URL" type="s:ST_String"/>
        <xsd:element name="Version" type="s:ST_String"/>
        <xsd:element name="Volume" type="s:ST_String"/>
        <xsd:element name="Year" type="s:ST_String"/>
        <xsd:element name="YearAccessed" type="s:ST_String"/>
      </xsd:choice>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="Sources" type="CT_Sources"/>
  <xsd:complexType name="CT_Sources">
    <xsd:sequence>
      <xsd:element name="Source" type="CT_SourceType" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="SelectedStyle" type="s:ST_String"/>
    <xsd:attribute name="StyleName" type="s:ST_String"/>
    <xsd:attribute name="URI" type="s:ST_String"/>
  </xsd:complexType>
</xsd:schema>
