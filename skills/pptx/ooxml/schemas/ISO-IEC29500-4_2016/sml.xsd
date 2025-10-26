<?xml version="1.0" encoding="utf-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
  xmlns:s="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
  targetNamespace="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  elementFormDefault="qualified">
  <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    schemaLocation="shared-relationshipReference.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
    schemaLocation="shared-commonSimpleTypes.xsd"/>
  <xsd:import 
    namespace="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
    schemaLocation="dml-spreadsheetDrawing.xsd"/>
  <xsd:complexType name="CT_AutoFilter">
    <xsd:sequence>
      <xsd:element name="filterColumn" minOccurs="0" maxOccurs="unbounded" type="CT_FilterColumn"/>
      <xsd:element name="sortState" minOccurs="0" maxOccurs="1" type="CT_SortState"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="ref" type="ST_Ref"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FilterColumn">
    <xsd:choice minOccurs="0" maxOccurs="1">
      <xsd:element name="filters" type="CT_Filters" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="top10" type="CT_Top10" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="customFilters" type="CT_CustomFilters" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="dynamicFilter" type="CT_DynamicFilter" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="colorFilter" type="CT_ColorFilter" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="iconFilter" minOccurs="0" maxOccurs="1" type="CT_IconFilter"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:choice>
    <xsd:attribute name="colId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="hiddenButton" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showButton" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Filters">
    <xsd:sequence>
      <xsd:element name="filter" type="CT_Filter" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="dateGroupItem" type="CT_DateGroupItem" minOccurs="0" maxOccurs="unbounded"
      />
    </xsd:sequence>
    <xsd:attribute name="blank" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="calendarType" type="s:ST_CalendarType" use="optional" default="none"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Filter">
    <xsd:attribute name="val" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomFilters">
    <xsd:sequence>
      <xsd:element name="customFilter" type="CT_CustomFilter" minOccurs="1" maxOccurs="2"/>
    </xsd:sequence>
    <xsd:attribute name="and" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomFilter">
    <xsd:attribute name="operator" type="ST_FilterOperator" default="equal" use="optional"/>
    <xsd:attribute name="val" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Top10">
    <xsd:attribute name="top" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="percent" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="val" type="xsd:double" use="required"/>
    <xsd:attribute name="filterVal" type="xsd:double" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ColorFilter">
    <xsd:attribute name="dxfId" type="ST_DxfId" use="optional"/>
    <xsd:attribute name="cellColor" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_IconFilter">
    <xsd:attribute name="iconSet" type="ST_IconSetType" use="required"/>
    <xsd:attribute name="iconId" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_FilterOperator">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="equal"/>
      <xsd:enumeration value="lessThan"/>
      <xsd:enumeration value="lessThanOrEqual"/>
      <xsd:enumeration value="notEqual"/>
      <xsd:enumeration value="greaterThanOrEqual"/>
      <xsd:enumeration value="greaterThan"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_DynamicFilter">
    <xsd:attribute name="type" type="ST_DynamicFilterType" use="required"/>
    <xsd:attribute name="val" type="xsd:double" use="optional"/>
    <xsd:attribute name="valIso" type="xsd:dateTime" use="optional"/>
    <xsd:attribute name="maxVal" type="xsd:double" use="optional"/>
    <xsd:attribute name="maxValIso" type="xsd:dateTime" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DynamicFilterType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="null"/>
      <xsd:enumeration value="aboveAverage"/>
      <xsd:enumeration value="belowAverage"/>
      <xsd:enumeration value="tomorrow"/>
      <xsd:enumeration value="today"/>
      <xsd:enumeration value="yesterday"/>
      <xsd:enumeration value="nextWeek"/>
      <xsd:enumeration value="thisWeek"/>
      <xsd:enumeration value="lastWeek"/>
      <xsd:enumeration value="nextMonth"/>
      <xsd:enumeration value="thisMonth"/>
      <xsd:enumeration value="lastMonth"/>
      <xsd:enumeration value="nextQuarter"/>
      <xsd:enumeration value="thisQuarter"/>
      <xsd:enumeration value="lastQuarter"/>
      <xsd:enumeration value="nextYear"/>
      <xsd:enumeration value="thisYear"/>
      <xsd:enumeration value="lastYear"/>
      <xsd:enumeration value="yearToDate"/>
      <xsd:enumeration value="Q1"/>
      <xsd:enumeration value="Q2"/>
      <xsd:enumeration value="Q3"/>
      <xsd:enumeration value="Q4"/>
      <xsd:enumeration value="M1"/>
      <xsd:enumeration value="M2"/>
      <xsd:enumeration value="M3"/>
      <xsd:enumeration value="M4"/>
      <xsd:enumeration value="M5"/>
      <xsd:enumeration value="M6"/>
      <xsd:enumeration value="M7"/>
      <xsd:enumeration value="M8"/>
      <xsd:enumeration value="M9"/>
      <xsd:enumeration value="M10"/>
      <xsd:enumeration value="M11"/>
      <xsd:enumeration value="M12"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_IconSetType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="3Arrows"/>
      <xsd:enumeration value="3ArrowsGray"/>
      <xsd:enumeration value="3Flags"/>
      <xsd:enumeration value="3TrafficLights1"/>
      <xsd:enumeration value="3TrafficLights2"/>
      <xsd:enumeration value="3Signs"/>
      <xsd:enumeration value="3Symbols"/>
      <xsd:enumeration value="3Symbols2"/>
      <xsd:enumeration value="4Arrows"/>
      <xsd:enumeration value="4ArrowsGray"/>
      <xsd:enumeration value="4RedToBlack"/>
      <xsd:enumeration value="4Rating"/>
      <xsd:enumeration value="4TrafficLights"/>
      <xsd:enumeration value="5Arrows"/>
      <xsd:enumeration value="5ArrowsGray"/>
      <xsd:enumeration value="5Rating"/>
      <xsd:enumeration value="5Quarters"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_SortState">
    <xsd:sequence>
      <xsd:element name="sortCondition" minOccurs="0" maxOccurs="64" type="CT_SortCondition"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="columnSort" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="caseSensitive" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="sortMethod" type="ST_SortMethod" use="optional" default="none"/>
    <xsd:attribute name="ref" type="ST_Ref" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SortCondition">
    <xsd:attribute name="descending" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="sortBy" type="ST_SortBy" use="optional" default="value"/>
    <xsd:attribute name="ref" type="ST_Ref" use="required"/>
    <xsd:attribute name="customList" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="dxfId" type="ST_DxfId" use="optional"/>
    <xsd:attribute name="iconSet" type="ST_IconSetType" use="optional" default="3Arrows"/>
    <xsd:attribute name="iconId" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_SortBy">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="value"/>
      <xsd:enumeration value="cellColor"/>
      <xsd:enumeration value="fontColor"/>
      <xsd:enumeration value="icon"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_SortMethod">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="stroke"/>
      <xsd:enumeration value="pinYin"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_DateGroupItem">
    <xsd:attribute name="year" type="xsd:unsignedShort" use="required"/>
    <xsd:attribute name="month" type="xsd:unsignedShort" use="optional"/>
    <xsd:attribute name="day" type="xsd:unsignedShort" use="optional"/>
    <xsd:attribute name="hour" type="xsd:unsignedShort" use="optional"/>
    <xsd:attribute name="minute" type="xsd:unsignedShort" use="optional"/>
    <xsd:attribute name="second" type="xsd:unsignedShort" use="optional"/>
    <xsd:attribute name="dateTimeGrouping" type="ST_DateTimeGrouping" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DateTimeGrouping">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="year"/>
      <xsd:enumeration value="month"/>
      <xsd:enumeration value="day"/>
      <xsd:enumeration value="hour"/>
      <xsd:enumeration value="minute"/>
      <xsd:enumeration value="second"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_CellRef">
    <xsd:restriction base="xsd:string"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Ref">
    <xsd:restriction base="xsd:string"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_RefA">
    <xsd:restriction base="xsd:string"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Sqref">
    <xsd:list itemType="ST_Ref"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Formula">
    <xsd:restriction base="s:ST_Xstring"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_UnsignedIntHex">
    <xsd:restriction base="xsd:hexBinary">
      <xsd:length value="4"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_UnsignedShortHex">
    <xsd:restriction base="xsd:hexBinary">
      <xsd:length value="2"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_XStringElement">
    <xsd:attribute name="v" type="s:ST_Xstring" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Extension">
    <xsd:sequence>
      <xsd:any processContents="lax"/>
    </xsd:sequence>
    <xsd:attribute name="uri" type="xsd:token"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ObjectAnchor">
    <xsd:sequence>
      <xsd:element ref="xdr:from" minOccurs="1" maxOccurs="1"/>
      <xsd:element ref="xdr:to" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="moveWithCells" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="sizeWithCells" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:group name="EG_ExtensionList">
    <xsd:sequence>
      <xsd:element name="ext" type="CT_Extension" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:group>
  <xsd:complexType name="CT_ExtensionList">
    <xsd:sequence>
      <xsd:group ref="EG_ExtensionList" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="calcChain" type="CT_CalcChain"/>
  <xsd:complexType name="CT_CalcChain">
    <xsd:sequence>
      <xsd:element name="c" type="CT_CalcCell" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_CalcCell">
    <xsd:attribute name="r" type="ST_CellRef" use="optional"/>
    <xsd:attribute name="ref" type="ST_CellRef" use="optional"/>
    <xsd:attribute name="i" type="xsd:int" use="optional" default="0"/>
    <xsd:attribute name="s" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="l" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="t" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="a" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:element name="comments" type="CT_Comments"/>
  <xsd:complexType name="CT_Comments">
    <xsd:sequence>
      <xsd:element name="authors" type="CT_Authors" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="commentList" type="CT_CommentList" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Authors">
    <xsd:sequence>
      <xsd:element name="author" type="s:ST_Xstring" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_CommentList">
    <xsd:sequence>
      <xsd:element name="comment" type="CT_Comment" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Comment">
    <xsd:sequence>
      <xsd:element name="text" type="CT_Rst" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="commentPr" type="CT_CommentPr" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="ref" type="ST_Ref" use="required"/>
    <xsd:attribute name="authorId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="guid" type="s:ST_Guid" use="optional"/>
    <xsd:attribute name="shapeId" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CommentPr">
    <xsd:sequence>
      <xsd:element name="anchor" type="CT_ObjectAnchor" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="locked" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="defaultSize" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="print" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="disabled" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="autoFill" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="autoLine" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="altText" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="textHAlign" type="ST_TextHAlign" use="optional" default="left"/>
    <xsd:attribute name="textVAlign" type="ST_TextVAlign" use="optional" default="top"/>
    <xsd:attribute name="lockText" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="justLastX" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="autoScale" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextHAlign">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="left"/>
      <xsd:enumeration value="center"/>
      <xsd:enumeration value="right"/>
      <xsd:enumeration value="justify"/>
      <xsd:enumeration value="distributed"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextVAlign">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="top"/>
      <xsd:enumeration value="center"/>
      <xsd:enumeration value="bottom"/>
      <xsd:enumeration value="justify"/>
      <xsd:enumeration value="distributed"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:element name="MapInfo" type="CT_MapInfo"/>
  <xsd:complexType name="CT_MapInfo">
    <xsd:sequence>
      <xsd:element name="Schema" type="CT_Schema" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="Map" type="CT_Map" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="SelectionNamespaces" type="xsd:string" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Schema" mixed="true">
    <xsd:sequence>
      <xsd:any/>
    </xsd:sequence>
    <xsd:attribute name="ID" type="xsd:string" use="required"/>
    <xsd:attribute name="SchemaRef" type="xsd:string" use="optional"/>
    <xsd:attribute name="Namespace" type="xsd:string" use="optional"/>
    <xsd:attribute name="SchemaLanguage" type="xsd:token" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Map">
    <xsd:sequence>
      <xsd:element name="DataBinding" type="CT_DataBinding" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="ID" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="Name" type="xsd:string" use="required"/>
    <xsd:attribute name="RootElement" type="xsd:string" use="required"/>
    <xsd:attribute name="SchemaID" type="xsd:string" use="required"/>
    <xsd:attribute name="ShowImportExportValidationErrors" type="xsd:boolean" use="required"/>
    <xsd:attribute name="AutoFit" type="xsd:boolean" use="required"/>
    <xsd:attribute name="Append" type="xsd:boolean" use="required"/>
    <xsd:attribute name="PreserveSortAFLayout" type="xsd:boolean" use="required"/>
    <xsd:attribute name="PreserveFormat" type="xsd:boolean" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DataBinding">
    <xsd:sequence>
      <xsd:any/>
    </xsd:sequence>
    <xsd:attribute name="DataBindingName" type="xsd:string" use="optional"/>
    <xsd:attribute name="FileBinding" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="ConnectionID" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="FileBindingName" type="xsd:string" use="optional"/>
    <xsd:attribute name="DataBindingLoadMode" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:element name="connections" type="CT_Connections"/>
  <xsd:complexType name="CT_Connections">
    <xsd:sequence>
      <xsd:element name="connection" minOccurs="1" maxOccurs="unbounded" type="CT_Connection"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Connection">
    <xsd:sequence>
      <xsd:element name="dbPr" minOccurs="0" maxOccurs="1" type="CT_DbPr"/>
      <xsd:element name="olapPr" minOccurs="0" maxOccurs="1" type="CT_OlapPr"/>
      <xsd:element name="webPr" minOccurs="0" maxOccurs="1" type="CT_WebPr"/>
      <xsd:element name="textPr" minOccurs="0" maxOccurs="1" type="CT_TextPr"/>
      <xsd:element name="parameters" minOccurs="0" maxOccurs="1" type="CT_Parameters"/>
      <xsd:element name="extLst" minOccurs="0" maxOccurs="1" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="id" use="required" type="xsd:unsignedInt"/>
    <xsd:attribute name="sourceFile" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="odcFile" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="keepAlive" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="interval" use="optional" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="name" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="description" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="type" use="optional" type="xsd:unsignedInt"/>
    <xsd:attribute name="reconnectionMethod" use="optional" type="xsd:unsignedInt" default="1"/>
    <xsd:attribute name="refreshedVersion" use="required" type="xsd:unsignedByte"/>
    <xsd:attribute name="minRefreshableVersion" use="optional" type="xsd:unsignedByte" default="0"/>
    <xsd:attribute name="savePassword" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="new" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="deleted" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="onlyUseConnectionFile" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="background" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="refreshOnLoad" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="saveData" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="credentials" use="optional" type="ST_CredMethod" default="integrated"/>
    <xsd:attribute name="singleSignOnId" use="optional" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_CredMethod">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="integrated"/>
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="stored"/>
      <xsd:enumeration value="prompt"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_DbPr">
    <xsd:attribute name="connection" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="command" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="serverCommand" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="commandType" use="optional" type="xsd:unsignedInt" default="2"/>
  </xsd:complexType>
  <xsd:complexType name="CT_OlapPr">
    <xsd:attribute name="local" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="localConnection" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="localRefresh" use="optional" type="xsd:boolean" default="true"/>
    <xsd:attribute name="sendLocale" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="rowDrillCount" use="optional" type="xsd:unsignedInt"/>
    <xsd:attribute name="serverFill" use="optional" type="xsd:boolean" default="true"/>
    <xsd:attribute name="serverNumberFormat" use="optional" type="xsd:boolean" default="true"/>
    <xsd:attribute name="serverFont" use="optional" type="xsd:boolean" default="true"/>
    <xsd:attribute name="serverFontColor" use="optional" type="xsd:boolean" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_WebPr">
    <xsd:sequence>
      <xsd:element name="tables" minOccurs="0" maxOccurs="1" type="CT_Tables"/>
    </xsd:sequence>
    <xsd:attribute name="xml" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="sourceData" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="parsePre" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="consecutive" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="firstRow" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="xl97" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="textDates" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="xl2000" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="url" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="post" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="htmlTables" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="htmlFormat" use="optional" type="ST_HtmlFmt" default="none"/>
    <xsd:attribute name="editPage" use="optional" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_HtmlFmt">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="rtf"/>
      <xsd:enumeration value="all"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Parameters">
    <xsd:sequence>
      <xsd:element name="parameter" minOccurs="1" maxOccurs="unbounded" type="CT_Parameter"/>
    </xsd:sequence>
    <xsd:attribute name="count" use="optional" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Parameter">
    <xsd:attribute name="name" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="sqlType" use="optional" type="xsd:int" default="0"/>
    <xsd:attribute name="parameterType" use="optional" type="ST_ParameterType" default="prompt"/>
    <xsd:attribute name="refreshOnChange" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="prompt" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="boolean" use="optional" type="xsd:boolean"/>
    <xsd:attribute name="double" use="optional" type="xsd:double"/>
    <xsd:attribute name="integer" use="optional" type="xsd:int"/>
    <xsd:attribute name="string" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="cell" use="optional" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_ParameterType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="prompt"/>
      <xsd:enumeration value="value"/>
      <xsd:enumeration value="cell"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Tables">
    <xsd:choice minOccurs="1" maxOccurs="unbounded">
      <xsd:element name="m" type="CT_TableMissing"/>
      <xsd:element name="s" type="CT_XStringElement"/>
      <xsd:element name="x" type="CT_Index"/>
    </xsd:choice>
    <xsd:attribute name="count" use="optional" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TableMissing"/>
  <xsd:complexType name="CT_TextPr">
    <xsd:sequence>
      <xsd:element name="textFields" minOccurs="0" maxOccurs="1" type="CT_TextFields"/>
    </xsd:sequence>
    <xsd:attribute name="prompt" use="optional" type="xsd:boolean" default="true"/>
    <xsd:attribute name="fileType" use="optional" type="ST_FileType" default="win"/>
    <xsd:attribute name="codePage" use="optional" type="xsd:unsignedInt" default="1252"/>
    <xsd:attribute name="characterSet" use="optional" type="xsd:string"/>
    <xsd:attribute name="firstRow" use="optional" type="xsd:unsignedInt" default="1"/>
    <xsd:attribute name="sourceFile" use="optional" type="s:ST_Xstring" default=""/>
    <xsd:attribute name="delimited" use="optional" type="xsd:boolean" default="true"/>
    <xsd:attribute name="decimal" use="optional" type="s:ST_Xstring" default="."/>
    <xsd:attribute name="thousands" use="optional" type="s:ST_Xstring" default=","/>
    <xsd:attribute name="tab" use="optional" type="xsd:boolean" default="true"/>
    <xsd:attribute name="space" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="comma" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="semicolon" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="consecutive" use="optional" type="xsd:boolean" default="false"/>
    <xsd:attribute name="qualifier" use="optional" type="ST_Qualifier" default="doubleQuote"/>
    <xsd:attribute name="delimiter" use="optional" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_FileType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="mac"/>
      <xsd:enumeration value="win"/>
      <xsd:enumeration value="dos"/>
      <xsd:enumeration value="lin"/>
      <xsd:enumeration value="other"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Qualifier">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="doubleQuote"/>
      <xsd:enumeration value="singleQuote"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextFields">
    <xsd:sequence>
      <xsd:element name="textField" minOccurs="1" maxOccurs="unbounded" type="CT_TextField"/>
    </xsd:sequence>
    <xsd:attribute name="count" use="optional" type="xsd:unsignedInt" default="1"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TextField">
    <xsd:attribute name="type" use="optional" type="ST_ExternalConnectionType" default="general"/>
    <xsd:attribute name="position" use="optional" type="xsd:unsignedInt" default="0"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_ExternalConnectionType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="general"/>
      <xsd:enumeration value="text"/>
      <xsd:enumeration value="MDY"/>
      <xsd:enumeration value="DMY"/>
      <xsd:enumeration value="YMD"/>
      <xsd:enumeration value="MYD"/>
      <xsd:enumeration value="DYM"/>
      <xsd:enumeration value="YDM"/>
      <xsd:enumeration value="skip"/>
      <xsd:enumeration value="EMD"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:element name="pivotCacheDefinition" type="CT_PivotCacheDefinition"/>
  <xsd:element name="pivotCacheRecords" type="CT_PivotCacheRecords"/>
  <xsd:element name="pivotTableDefinition" type="CT_pivotTableDefinition"/>
  <xsd:complexType name="CT_PivotCacheDefinition">
    <xsd:sequence>
      <xsd:element name="cacheSource" type="CT_CacheSource" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="cacheFields" type="CT_CacheFields" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="cacheHierarchies" minOccurs="0" type="CT_CacheHierarchies"/>
      <xsd:element name="kpis" minOccurs="0" type="CT_PCDKPIs"/>
      <xsd:element name="tupleCache" minOccurs="0" type="CT_TupleCache"/>
      <xsd:element name="calculatedItems" minOccurs="0" type="CT_CalculatedItems"/>
      <xsd:element name="calculatedMembers" type="CT_CalculatedMembers" minOccurs="0"/>
      <xsd:element name="dimensions" type="CT_Dimensions" minOccurs="0"/>
      <xsd:element name="measureGroups" type="CT_MeasureGroups" minOccurs="0"/>
      <xsd:element name="maps" type="CT_MeasureDimensionMaps" minOccurs="0"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute ref="r:id" use="optional"/>
    <xsd:attribute name="invalid" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="saveData" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="refreshOnLoad" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="optimizeMemory" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="enableRefresh" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="refreshedBy" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="refreshedDate" type="xsd:double" use="optional"/>
    <xsd:attribute name="refreshedDateIso" type="xsd:dateTime" use="optional"/>
    <xsd:attribute name="backgroundQuery" type="xsd:boolean" default="false"/>
    <xsd:attribute name="missingItemsLimit" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="createdVersion" type="xsd:unsignedByte" use="optional" default="0"/>
    <xsd:attribute name="refreshedVersion" type="xsd:unsignedByte" use="optional" default="0"/>
    <xsd:attribute name="minRefreshableVersion" type="xsd:unsignedByte" use="optional" default="0"/>
    <xsd:attribute name="recordCount" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="upgradeOnRefresh" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="tupleCache" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="supportSubquery" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="supportAdvancedDrill" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CacheFields">
    <xsd:sequence>
      <xsd:element name="cacheField" type="CT_CacheField" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CacheField">
    <xsd:sequence>
      <xsd:element name="sharedItems" type="CT_SharedItems" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="fieldGroup" minOccurs="0" type="CT_FieldGroup"/>
      <xsd:element name="mpMap" minOccurs="0" maxOccurs="unbounded" type="CT_X"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="caption" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="propertyName" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="serverField" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="uniqueList" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="numFmtId" type="ST_NumFmtId" use="optional"/>
    <xsd:attribute name="formula" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="sqlType" type="xsd:int" use="optional" default="0"/>
    <xsd:attribute name="hierarchy" type="xsd:int" use="optional" default="0"/>
    <xsd:attribute name="level" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="databaseField" type="xsd:boolean" default="true"/>
    <xsd:attribute name="mappingCount" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="memberPropertyField" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CacheSource">
    <xsd:choice minOccurs="0" maxOccurs="1">
      <xsd:element name="worksheetSource" type="CT_WorksheetSource" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="consolidation" type="CT_Consolidation" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0"/>
    </xsd:choice>
    <xsd:attribute name="type" type="ST_SourceType" use="required"/>
    <xsd:attribute name="connectionId" type="xsd:unsignedInt" default="0" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_SourceType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="worksheet"/>
      <xsd:enumeration value="external"/>
      <xsd:enumeration value="consolidation"/>
      <xsd:enumeration value="scenario"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_WorksheetSource">
    <xsd:attribute name="ref" type="ST_Ref" use="optional"/>
    <xsd:attribute name="name" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="sheet" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute ref="r:id" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Consolidation">
    <xsd:sequence>
      <xsd:element name="pages" type="CT_Pages" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="rangeSets" type="CT_RangeSets" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="autoPage" type="xsd:boolean" default="true" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Pages">
    <xsd:sequence>
      <xsd:element name="page" type="CT_PCDSCPage" minOccurs="1" maxOccurs="4"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PCDSCPage">
    <xsd:sequence>
      <xsd:element name="pageItem" type="CT_PageItem" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PageItem">
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RangeSets">
    <xsd:sequence>
      <xsd:element name="rangeSet" type="CT_RangeSet" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RangeSet">
    <xsd:attribute name="i1" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="i2" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="i3" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="i4" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="ref" type="ST_Ref" use="optional"/>
    <xsd:attribute name="name" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="sheet" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute ref="r:id" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SharedItems">
    <xsd:choice minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="m" type="CT_Missing" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="n" type="CT_Number" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="b" type="CT_Boolean" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="e" type="CT_Error" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="s" type="CT_String" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="d" type="CT_DateTime" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
    <xsd:attribute name="containsSemiMixedTypes" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="containsNonDate" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="containsDate" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="containsString" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="containsBlank" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="containsMixedTypes" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="containsNumber" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="containsInteger" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="minValue" type="xsd:double" use="optional"/>
    <xsd:attribute name="maxValue" type="xsd:double" use="optional"/>
    <xsd:attribute name="minDate" type="xsd:dateTime" use="optional"/>
    <xsd:attribute name="maxDate" type="xsd:dateTime" use="optional"/>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="longText" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Missing">
    <xsd:sequence>
      <xsd:element name="tpls" minOccurs="0" maxOccurs="unbounded" type="CT_Tuples"/>
      <xsd:element name="x" minOccurs="0" maxOccurs="unbounded" type="CT_X"/>
    </xsd:sequence>
    <xsd:attribute name="u" type="xsd:boolean"/>
    <xsd:attribute name="f" type="xsd:boolean"/>
    <xsd:attribute name="c" type="s:ST_Xstring"/>
    <xsd:attribute name="cp" type="xsd:unsignedInt"/>
    <xsd:attribute name="in" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="bc" type="ST_UnsignedIntHex" use="optional"/>
    <xsd:attribute name="fc" type="ST_UnsignedIntHex" use="optional"/>
    <xsd:attribute name="i" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="un" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="st" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="b" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Number">
    <xsd:sequence>
      <xsd:element name="tpls" minOccurs="0" maxOccurs="unbounded" type="CT_Tuples"/>
      <xsd:element name="x" minOccurs="0" maxOccurs="unbounded" type="CT_X"/>
    </xsd:sequence>
    <xsd:attribute name="v" use="required" type="xsd:double"/>
    <xsd:attribute name="u" type="xsd:boolean"/>
    <xsd:attribute name="f" type="xsd:boolean"/>
    <xsd:attribute name="c" type="s:ST_Xstring"/>
    <xsd:attribute name="cp" type="xsd:unsignedInt"/>
    <xsd:attribute name="in" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="bc" type="ST_UnsignedIntHex" use="optional"/>
    <xsd:attribute name="fc" type="ST_UnsignedIntHex" use="optional"/>
    <xsd:attribute name="i" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="un" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="st" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="b" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Boolean">
    <xsd:sequence>
      <xsd:element name="x" minOccurs="0" maxOccurs="unbounded" type="CT_X"/>
    </xsd:sequence>
    <xsd:attribute name="v" use="required" type="xsd:boolean"/>
    <xsd:attribute name="u" type="xsd:boolean"/>
    <xsd:attribute name="f" type="xsd:boolean"/>
    <xsd:attribute name="c" type="s:ST_Xstring"/>
    <xsd:attribute name="cp" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Error">
    <xsd:sequence>
      <xsd:element name="tpls" minOccurs="0" type="CT_Tuples"/>
      <xsd:element name="x" minOccurs="0" maxOccurs="unbounded" type="CT_X"/>
    </xsd:sequence>
    <xsd:attribute name="v" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="u" type="xsd:boolean"/>
    <xsd:attribute name="f" type="xsd:boolean"/>
    <xsd:attribute name="c" type="s:ST_Xstring"/>
    <xsd:attribute name="cp" type="xsd:unsignedInt"/>
    <xsd:attribute name="in" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="bc" type="ST_UnsignedIntHex" use="optional"/>
    <xsd:attribute name="fc" type="ST_UnsignedIntHex" use="optional"/>
    <xsd:attribute name="i" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="un" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="st" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="b" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_String">
    <xsd:sequence>
      <xsd:element name="tpls" minOccurs="0" maxOccurs="unbounded" type="CT_Tuples"/>
      <xsd:element name="x" minOccurs="0" maxOccurs="unbounded" type="CT_X"/>
    </xsd:sequence>
    <xsd:attribute name="v" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="u" type="xsd:boolean"/>
    <xsd:attribute name="f" type="xsd:boolean"/>
    <xsd:attribute name="c" type="s:ST_Xstring"/>
    <xsd:attribute name="cp" type="xsd:unsignedInt"/>
    <xsd:attribute name="in" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="bc" type="ST_UnsignedIntHex" use="optional"/>
    <xsd:attribute name="fc" type="ST_UnsignedIntHex" use="optional"/>
    <xsd:attribute name="i" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="un" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="st" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="b" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DateTime">
    <xsd:sequence>
      <xsd:element name="x" minOccurs="0" maxOccurs="unbounded" type="CT_X"/>
    </xsd:sequence>
    <xsd:attribute name="v" use="required" type="xsd:dateTime"/>
    <xsd:attribute name="u" type="xsd:boolean"/>
    <xsd:attribute name="f" type="xsd:boolean"/>
    <xsd:attribute name="c" type="s:ST_Xstring"/>
    <xsd:attribute name="cp" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FieldGroup">
    <xsd:sequence>
      <xsd:element name="rangePr" minOccurs="0" type="CT_RangePr"/>
      <xsd:element name="discretePr" minOccurs="0" type="CT_DiscretePr"/>
      <xsd:element name="groupItems" minOccurs="0" type="CT_GroupItems"/>
    </xsd:sequence>
    <xsd:attribute name="par" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="base" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RangePr">
    <xsd:attribute name="autoStart" type="xsd:boolean" default="true"/>
    <xsd:attribute name="autoEnd" type="xsd:boolean" default="true"/>
    <xsd:attribute name="groupBy" type="ST_GroupBy" default="range"/>
    <xsd:attribute name="startNum" type="xsd:double"/>
    <xsd:attribute name="endNum" type="xsd:double"/>
    <xsd:attribute name="startDate" type="xsd:dateTime"/>
    <xsd:attribute name="endDate" type="xsd:dateTime"/>
    <xsd:attribute name="groupInterval" type="xsd:double" default="1"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_GroupBy">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="range"/>
      <xsd:enumeration value="seconds"/>
      <xsd:enumeration value="minutes"/>
      <xsd:enumeration value="hours"/>
      <xsd:enumeration value="days"/>
      <xsd:enumeration value="months"/>
      <xsd:enumeration value="quarters"/>
      <xsd:enumeration value="years"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_DiscretePr">
    <xsd:sequence>
      <xsd:element name="x" maxOccurs="unbounded" type="CT_Index"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GroupItems">
    <xsd:choice maxOccurs="unbounded">
      <xsd:element name="m" type="CT_Missing"/>
      <xsd:element name="n" type="CT_Number"/>
      <xsd:element name="b" type="CT_Boolean"/>
      <xsd:element name="e" type="CT_Error"/>
      <xsd:element name="s" type="CT_String"/>
      <xsd:element name="d" type="CT_DateTime"/>
    </xsd:choice>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotCacheRecords">
    <xsd:sequence>
      <xsd:element name="r" minOccurs="0" maxOccurs="unbounded" type="CT_Record"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Record">
    <xsd:choice maxOccurs="unbounded">
      <xsd:element name="m" type="CT_Missing"/>
      <xsd:element name="n" type="CT_Number"/>
      <xsd:element name="b" type="CT_Boolean"/>
      <xsd:element name="e" type="CT_Error"/>
      <xsd:element name="s" type="CT_String"/>
      <xsd:element name="d" type="CT_DateTime"/>
      <xsd:element name="x" type="CT_Index"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:complexType name="CT_PCDKPIs">
    <xsd:sequence>
      <xsd:element name="kpi" minOccurs="0" maxOccurs="unbounded" type="CT_PCDKPI"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PCDKPI">
    <xsd:attribute name="uniqueName" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="caption" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="displayFolder" type="s:ST_Xstring"/>
    <xsd:attribute name="measureGroup" type="s:ST_Xstring"/>
    <xsd:attribute name="parent" type="s:ST_Xstring"/>
    <xsd:attribute name="value" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="goal" type="s:ST_Xstring"/>
    <xsd:attribute name="status" type="s:ST_Xstring"/>
    <xsd:attribute name="trend" type="s:ST_Xstring"/>
    <xsd:attribute name="weight" type="s:ST_Xstring"/>
    <xsd:attribute name="time" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CacheHierarchies">
    <xsd:sequence>
      <xsd:element name="cacheHierarchy" minOccurs="0" maxOccurs="unbounded"
        type="CT_CacheHierarchy"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CacheHierarchy">
    <xsd:sequence>
      <xsd:element name="fieldsUsage" minOccurs="0" type="CT_FieldsUsage"/>
      <xsd:element name="groupLevels" minOccurs="0" type="CT_GroupLevels"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="uniqueName" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="caption" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="measure" type="xsd:boolean" default="false"/>
    <xsd:attribute name="set" type="xsd:boolean" default="false"/>
    <xsd:attribute name="parentSet" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="iconSet" type="xsd:int" default="0"/>
    <xsd:attribute name="attribute" type="xsd:boolean" default="false"/>
    <xsd:attribute name="time" type="xsd:boolean" default="false"/>
    <xsd:attribute name="keyAttribute" type="xsd:boolean" default="false"/>
    <xsd:attribute name="defaultMemberUniqueName" type="s:ST_Xstring"/>
    <xsd:attribute name="allUniqueName" type="s:ST_Xstring"/>
    <xsd:attribute name="allCaption" type="s:ST_Xstring"/>
    <xsd:attribute name="dimensionUniqueName" type="s:ST_Xstring"/>
    <xsd:attribute name="displayFolder" type="s:ST_Xstring"/>
    <xsd:attribute name="measureGroup" type="s:ST_Xstring"/>
    <xsd:attribute name="measures" type="xsd:boolean" default="false"/>
    <xsd:attribute name="count" use="required" type="xsd:unsignedInt"/>
    <xsd:attribute name="oneField" type="xsd:boolean" default="false"/>
    <xsd:attribute name="memberValueDatatype" use="optional" type="xsd:unsignedShort"/>
    <xsd:attribute name="unbalanced" use="optional" type="xsd:boolean"/>
    <xsd:attribute name="unbalancedGroup" use="optional" type="xsd:boolean"/>
    <xsd:attribute name="hidden" type="xsd:boolean" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FieldsUsage">
    <xsd:sequence>
      <xsd:element name="fieldUsage" minOccurs="0" maxOccurs="unbounded" type="CT_FieldUsage"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FieldUsage">
    <xsd:attribute name="x" use="required" type="xsd:int"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GroupLevels">
    <xsd:sequence>
      <xsd:element name="groupLevel" maxOccurs="unbounded" type="CT_GroupLevel"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GroupLevel">
    <xsd:sequence>
      <xsd:element name="groups" minOccurs="0" type="CT_Groups"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="uniqueName" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="caption" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="user" type="xsd:boolean" default="false"/>
    <xsd:attribute name="customRollUp" type="xsd:boolean" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Groups">
    <xsd:sequence>
      <xsd:element name="group" maxOccurs="unbounded" type="CT_LevelGroup"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_LevelGroup">
    <xsd:sequence>
      <xsd:element name="groupMembers" type="CT_GroupMembers"/>
    </xsd:sequence>
    <xsd:attribute name="name" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="uniqueName" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="caption" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="uniqueParent" type="s:ST_Xstring"/>
    <xsd:attribute name="id" type="xsd:int"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GroupMembers">
    <xsd:sequence>
      <xsd:element name="groupMember" maxOccurs="unbounded" type="CT_GroupMember"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GroupMember">
    <xsd:attribute name="uniqueName" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="group" type="xsd:boolean" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TupleCache">
    <xsd:sequence>
      <xsd:element name="entries" minOccurs="0" type="CT_PCDSDTCEntries"/>
      <xsd:element name="sets" minOccurs="0" type="CT_Sets"/>
      <xsd:element name="queryCache" minOccurs="0" type="CT_QueryCache"/>
      <xsd:element name="serverFormats" minOccurs="0" maxOccurs="1" type="CT_ServerFormats"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ServerFormat">
    <xsd:attribute name="culture" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="format" use="optional" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ServerFormats">
    <xsd:sequence>
      <xsd:element name="serverFormat" type="CT_ServerFormat" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PCDSDTCEntries">
    <xsd:choice maxOccurs="unbounded">
      <xsd:element name="m" type="CT_Missing"/>
      <xsd:element name="n" type="CT_Number"/>
      <xsd:element name="e" type="CT_Error"/>
      <xsd:element name="s" type="CT_String"/>
    </xsd:choice>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Tuples">
    <xsd:sequence>
      <xsd:element name="tpl" type="CT_Tuple" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="c" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Tuple">
    <xsd:attribute name="fld" type="xsd:unsignedInt"/>
    <xsd:attribute name="hier" type="xsd:unsignedInt"/>
    <xsd:attribute name="item" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Sets">
    <xsd:sequence>
      <xsd:element name="set" maxOccurs="unbounded" type="CT_Set"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Set">
    <xsd:sequence>
      <xsd:element name="tpls" minOccurs="0" maxOccurs="unbounded" type="CT_Tuples"/>
      <xsd:element name="sortByTuple" minOccurs="0" type="CT_Tuples"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
    <xsd:attribute name="maxRank" use="required" type="xsd:int"/>
    <xsd:attribute name="setDefinition" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="sortType" type="ST_SortType" default="none"/>
    <xsd:attribute name="queryFailed" type="xsd:boolean" default="false"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_SortType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="ascending"/>
      <xsd:enumeration value="descending"/>
      <xsd:enumeration value="ascendingAlpha"/>
      <xsd:enumeration value="descendingAlpha"/>
      <xsd:enumeration value="ascendingNatural"/>
      <xsd:enumeration value="descendingNatural"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_QueryCache">
    <xsd:sequence>
      <xsd:element name="query" maxOccurs="unbounded" type="CT_Query"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Query">
    <xsd:sequence>
      <xsd:element name="tpls" minOccurs="0" type="CT_Tuples"/>
    </xsd:sequence>
    <xsd:attribute name="mdx" use="required" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CalculatedItems">
    <xsd:sequence>
      <xsd:element name="calculatedItem" maxOccurs="unbounded" type="CT_CalculatedItem"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CalculatedItem">
    <xsd:sequence>
      <xsd:element name="pivotArea" type="CT_PivotArea"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="field" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="formula" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CalculatedMembers">
    <xsd:sequence>
      <xsd:element name="calculatedMember" maxOccurs="unbounded" type="CT_CalculatedMember"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CalculatedMember">
    <xsd:sequence minOccurs="0">
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="name" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="mdx" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="memberName" type="s:ST_Xstring"/>
    <xsd:attribute name="hierarchy" type="s:ST_Xstring"/>
    <xsd:attribute name="parent" type="s:ST_Xstring"/>
    <xsd:attribute name="solveOrder" type="xsd:int" default="0"/>
    <xsd:attribute name="set" type="xsd:boolean" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_pivotTableDefinition">
    <xsd:sequence>
      <xsd:element name="location" type="CT_Location"/>
      <xsd:element name="pivotFields" type="CT_PivotFields" minOccurs="0"/>
      <xsd:element name="rowFields" type="CT_RowFields" minOccurs="0"/>
      <xsd:element name="rowItems" type="CT_rowItems" minOccurs="0"/>
      <xsd:element name="colFields" type="CT_ColFields" minOccurs="0"/>
      <xsd:element name="colItems" type="CT_colItems" minOccurs="0"/>
      <xsd:element name="pageFields" type="CT_PageFields" minOccurs="0"/>
      <xsd:element name="dataFields" type="CT_DataFields" minOccurs="0"/>
      <xsd:element name="formats" type="CT_Formats" minOccurs="0"/>
      <xsd:element name="conditionalFormats" type="CT_ConditionalFormats" minOccurs="0"/>
      <xsd:element name="chartFormats" type="CT_ChartFormats" minOccurs="0"/>
      <xsd:element name="pivotHierarchies" type="CT_PivotHierarchies" minOccurs="0"/>
      <xsd:element name="pivotTableStyleInfo" minOccurs="0" maxOccurs="1" type="CT_PivotTableStyle"/>
      <xsd:element name="filters" minOccurs="0" maxOccurs="1" type="CT_PivotFilters"/>
      <xsd:element name="rowHierarchiesUsage" type="CT_RowHierarchiesUsage" minOccurs="0"
        maxOccurs="1"/>
      <xsd:element name="colHierarchiesUsage" type="CT_ColHierarchiesUsage" minOccurs="0"
        maxOccurs="1"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="name" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="cacheId" use="required" type="xsd:unsignedInt"/>
    <xsd:attribute name="dataOnRows" type="xsd:boolean" default="false"/>
    <xsd:attribute name="dataPosition" type="xsd:unsignedInt" use="optional"/>
    <xsd:attributeGroup ref="AG_AutoFormat"/>
    <xsd:attribute name="dataCaption" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="grandTotalCaption" type="s:ST_Xstring"/>
    <xsd:attribute name="errorCaption" type="s:ST_Xstring"/>
    <xsd:attribute name="showError" type="xsd:boolean" default="false"/>
    <xsd:attribute name="missingCaption" type="s:ST_Xstring"/>
    <xsd:attribute name="showMissing" type="xsd:boolean" default="true"/>
    <xsd:attribute name="pageStyle" type="s:ST_Xstring"/>
    <xsd:attribute name="pivotTableStyle" type="s:ST_Xstring"/>
    <xsd:attribute name="vacatedStyle" type="s:ST_Xstring"/>
    <xsd:attribute name="tag" type="s:ST_Xstring"/>
    <xsd:attribute name="updatedVersion" type="xsd:unsignedByte" default="0"/>
    <xsd:attribute name="minRefreshableVersion" type="xsd:unsignedByte" default="0"/>
    <xsd:attribute name="asteriskTotals" type="xsd:boolean" default="false"/>
    <xsd:attribute name="showItems" type="xsd:boolean" default="true"/>
    <xsd:attribute name="editData" type="xsd:boolean" default="false"/>
    <xsd:attribute name="disableFieldList" type="xsd:boolean" default="false"/>
    <xsd:attribute name="showCalcMbrs" type="xsd:boolean" default="true"/>
    <xsd:attribute name="visualTotals" type="xsd:boolean" default="true"/>
    <xsd:attribute name="showMultipleLabel" type="xsd:boolean" default="true"/>
    <xsd:attribute name="showDataDropDown" type="xsd:boolean" default="true"/>
    <xsd:attribute name="showDrill" type="xsd:boolean" default="true"/>
    <xsd:attribute name="printDrill" type="xsd:boolean" default="false"/>
    <xsd:attribute name="showMemberPropertyTips" type="xsd:boolean" default="true"/>
    <xsd:attribute name="showDataTips" type="xsd:boolean" default="true"/>
    <xsd:attribute name="enableWizard" type="xsd:boolean" default="true"/>
    <xsd:attribute name="enableDrill" type="xsd:boolean" default="true"/>
    <xsd:attribute name="enableFieldProperties" type="xsd:boolean" default="true"/>
    <xsd:attribute name="preserveFormatting" type="xsd:boolean" default="true"/>
    <xsd:attribute name="useAutoFormatting" type="xsd:boolean" default="false"/>
    <xsd:attribute name="pageWrap" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="pageOverThenDown" type="xsd:boolean" default="false"/>
    <xsd:attribute name="subtotalHiddenItems" type="xsd:boolean" default="false"/>
    <xsd:attribute name="rowGrandTotals" type="xsd:boolean" default="true"/>
    <xsd:attribute name="colGrandTotals" type="xsd:boolean" default="true"/>
    <xsd:attribute name="fieldPrintTitles" type="xsd:boolean" default="false"/>
    <xsd:attribute name="itemPrintTitles" type="xsd:boolean" default="false"/>
    <xsd:attribute name="mergeItem" type="xsd:boolean" default="false"/>
    <xsd:attribute name="showDropZones" type="xsd:boolean" default="true"/>
    <xsd:attribute name="createdVersion" type="xsd:unsignedByte" default="0"/>
    <xsd:attribute name="indent" type="xsd:unsignedInt" default="1"/>
    <xsd:attribute name="showEmptyRow" type="xsd:boolean" default="false"/>
    <xsd:attribute name="showEmptyCol" type="xsd:boolean" default="false"/>
    <xsd:attribute name="showHeaders" type="xsd:boolean" default="true"/>
    <xsd:attribute name="compact" type="xsd:boolean" default="true"/>
    <xsd:attribute name="outline" type="xsd:boolean" default="false"/>
    <xsd:attribute name="outlineData" type="xsd:boolean" default="false"/>
    <xsd:attribute name="compactData" type="xsd:boolean" default="true"/>
    <xsd:attribute name="published" type="xsd:boolean" default="false"/>
    <xsd:attribute name="gridDropZones" type="xsd:boolean" default="false"/>
    <xsd:attribute name="immersive" type="xsd:boolean" default="true"/>
    <xsd:attribute name="multipleFieldFilters" type="xsd:boolean" default="true"/>
    <xsd:attribute name="chartFormat" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="rowHeaderCaption" type="s:ST_Xstring"/>
    <xsd:attribute name="colHeaderCaption" type="s:ST_Xstring"/>
    <xsd:attribute name="fieldListSortAscending" type="xsd:boolean" default="false"/>
    <xsd:attribute name="mdxSubqueries" type="xsd:boolean" default="false"/>
    <xsd:attribute name="customListSort" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Location">
    <xsd:attribute name="ref" use="required" type="ST_Ref"/>
    <xsd:attribute name="firstHeaderRow" use="required" type="xsd:unsignedInt"/>
    <xsd:attribute name="firstDataRow" use="required" type="xsd:unsignedInt"/>
    <xsd:attribute name="firstDataCol" use="required" type="xsd:unsignedInt"/>
    <xsd:attribute name="rowPageCount" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="colPageCount" type="xsd:unsignedInt" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotFields">
    <xsd:sequence>
      <xsd:element name="pivotField" maxOccurs="unbounded" type="CT_PivotField"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotField">
    <xsd:sequence>
      <xsd:element name="items" minOccurs="0" type="CT_Items"/>
      <xsd:element name="autoSortScope" minOccurs="0" type="CT_AutoSortScope"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="s:ST_Xstring"/>
    <xsd:attribute name="axis" use="optional" type="ST_Axis"/>
    <xsd:attribute name="dataField" type="xsd:boolean" default="false"/>
    <xsd:attribute name="subtotalCaption" type="s:ST_Xstring"/>
    <xsd:attribute name="showDropDowns" type="xsd:boolean" default="true"/>
    <xsd:attribute name="hiddenLevel" type="xsd:boolean" default="false"/>
    <xsd:attribute name="uniqueMemberProperty" type="s:ST_Xstring"/>
    <xsd:attribute name="compact" type="xsd:boolean" default="true"/>
    <xsd:attribute name="allDrilled" type="xsd:boolean" default="false"/>
    <xsd:attribute name="numFmtId" type="ST_NumFmtId" use="optional"/>
    <xsd:attribute name="outline" type="xsd:boolean" default="true"/>
    <xsd:attribute name="subtotalTop" type="xsd:boolean" default="true"/>
    <xsd:attribute name="dragToRow" type="xsd:boolean" default="true"/>
    <xsd:attribute name="dragToCol" type="xsd:boolean" default="true"/>
    <xsd:attribute name="multipleItemSelectionAllowed" type="xsd:boolean" default="false"/>
    <xsd:attribute name="dragToPage" type="xsd:boolean" default="true"/>
    <xsd:attribute name="dragToData" type="xsd:boolean" default="true"/>
    <xsd:attribute name="dragOff" type="xsd:boolean" default="true"/>
    <xsd:attribute name="showAll" type="xsd:boolean" default="true"/>
    <xsd:attribute name="insertBlankRow" type="xsd:boolean" default="false"/>
    <xsd:attribute name="serverField" type="xsd:boolean" default="false"/>
    <xsd:attribute name="insertPageBreak" type="xsd:boolean" default="false"/>
    <xsd:attribute name="autoShow" type="xsd:boolean" default="false"/>
    <xsd:attribute name="topAutoShow" type="xsd:boolean" default="true"/>
    <xsd:attribute name="hideNewItems" type="xsd:boolean" default="false"/>
    <xsd:attribute name="measureFilter" type="xsd:boolean" default="false"/>
    <xsd:attribute name="includeNewItemsInFilter" type="xsd:boolean" default="false"/>
    <xsd:attribute name="itemPageCount" type="xsd:unsignedInt" default="10"/>
    <xsd:attribute name="sortType" type="ST_FieldSortType" default="manual"/>
    <xsd:attribute name="dataSourceSort" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="nonAutoSortDefault" type="xsd:boolean" default="false"/>
    <xsd:attribute name="rankBy" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="defaultSubtotal" type="xsd:boolean" default="true"/>
    <xsd:attribute name="sumSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="countASubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="avgSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="maxSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="minSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="productSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="countSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="stdDevSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="stdDevPSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="varSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="varPSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="showPropCell" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showPropTip" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showPropAsCaption" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="defaultAttributeDrillState" type="xsd:boolean" use="optional"
      default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AutoSortScope">
    <xsd:sequence>
      <xsd:element name="pivotArea" type="CT_PivotArea"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Items">
    <xsd:sequence>
      <xsd:element name="item" maxOccurs="unbounded" type="CT_Item"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Item">
    <xsd:attribute name="n" type="s:ST_Xstring"/>
    <xsd:attribute name="t" type="ST_ItemType" default="data"/>
    <xsd:attribute name="h" type="xsd:boolean" default="false"/>
    <xsd:attribute name="s" type="xsd:boolean" default="false"/>
    <xsd:attribute name="sd" type="xsd:boolean" default="true"/>
    <xsd:attribute name="f" type="xsd:boolean" default="false"/>
    <xsd:attribute name="m" type="xsd:boolean" default="false"/>
    <xsd:attribute name="c" type="xsd:boolean" default="false"/>
    <xsd:attribute name="x" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="d" type="xsd:boolean" default="false"/>
    <xsd:attribute name="e" type="xsd:boolean" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PageFields">
    <xsd:sequence>
      <xsd:element name="pageField" maxOccurs="unbounded" type="CT_PageField"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PageField">
    <xsd:sequence minOccurs="0">
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="fld" use="required" type="xsd:int"/>
    <xsd:attribute name="item" use="optional" type="xsd:unsignedInt"/>
    <xsd:attribute name="hier" type="xsd:int"/>
    <xsd:attribute name="name" type="s:ST_Xstring"/>
    <xsd:attribute name="cap" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DataFields">
    <xsd:sequence>
      <xsd:element name="dataField" maxOccurs="unbounded" type="CT_DataField"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DataField">
    <xsd:sequence>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="name" use="optional" type="s:ST_Xstring"/>
    <xsd:attribute name="fld" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="subtotal" type="ST_DataConsolidateFunction" default="sum"/>
    <xsd:attribute name="showDataAs" type="ST_ShowDataAs" default="normal"/>
    <xsd:attribute name="baseField" type="xsd:int" default="-1"/>
    <xsd:attribute name="baseItem" type="xsd:unsignedInt" default="1048832"/>
    <xsd:attribute name="numFmtId" type="ST_NumFmtId" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_rowItems">
    <xsd:sequence>
      <xsd:element name="i" maxOccurs="unbounded" type="CT_I"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_colItems">
    <xsd:sequence>
      <xsd:element name="i" maxOccurs="unbounded" type="CT_I"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_I">
    <xsd:sequence>
      <xsd:element name="x" minOccurs="0" maxOccurs="unbounded" type="CT_X"/>
    </xsd:sequence>
    <xsd:attribute name="t" type="ST_ItemType" default="data"/>
    <xsd:attribute name="r" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="i" type="xsd:unsignedInt" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_X">
    <xsd:attribute name="v" type="xsd:int" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RowFields">
    <xsd:sequence>
      <xsd:element name="field" maxOccurs="unbounded" type="CT_Field"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ColFields">
    <xsd:sequence>
      <xsd:element name="field" maxOccurs="unbounded" type="CT_Field"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Field">
    <xsd:attribute name="x" type="xsd:int" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Formats">
    <xsd:sequence>
      <xsd:element name="format" maxOccurs="unbounded" type="CT_Format"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Format">
    <xsd:sequence>
      <xsd:element name="pivotArea" type="CT_PivotArea"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="action" type="ST_FormatAction" default="formatting"/>
    <xsd:attribute name="dxfId" type="ST_DxfId" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ConditionalFormats">
    <xsd:sequence>
      <xsd:element name="conditionalFormat" maxOccurs="unbounded" type="CT_ConditionalFormat"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ConditionalFormat">
    <xsd:sequence>
      <xsd:element name="pivotAreas" type="CT_PivotAreas"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="scope" type="ST_Scope" default="selection"/>
    <xsd:attribute name="type" type="ST_Type" default="none"/>
    <xsd:attribute name="priority" use="required" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotAreas">
    <xsd:sequence>
      <xsd:element name="pivotArea" minOccurs="0" maxOccurs="unbounded" type="CT_PivotArea"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Scope">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="selection"/>
      <xsd:enumeration value="data"/>
      <xsd:enumeration value="field"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Type">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="all"/>
      <xsd:enumeration value="row"/>
      <xsd:enumeration value="column"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_ChartFormats">
    <xsd:sequence>
      <xsd:element name="chartFormat" maxOccurs="unbounded" type="CT_ChartFormat"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ChartFormat">
    <xsd:sequence>
      <xsd:element name="pivotArea" type="CT_PivotArea"/>
    </xsd:sequence>
    <xsd:attribute name="chart" use="required" type="xsd:unsignedInt"/>
    <xsd:attribute name="format" use="required" type="xsd:unsignedInt"/>
    <xsd:attribute name="series" type="xsd:boolean" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotHierarchies">
    <xsd:sequence>
      <xsd:element name="pivotHierarchy" maxOccurs="unbounded" type="CT_PivotHierarchy"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotHierarchy">
    <xsd:sequence>
      <xsd:element name="mps" minOccurs="0" type="CT_MemberProperties"/>
      <xsd:element name="members" minOccurs="0" maxOccurs="unbounded" type="CT_Members"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="outline" type="xsd:boolean" default="false"/>
    <xsd:attribute name="multipleItemSelectionAllowed" type="xsd:boolean" default="false"/>
    <xsd:attribute name="subtotalTop" type="xsd:boolean" default="false"/>
    <xsd:attribute name="showInFieldList" type="xsd:boolean" default="true"/>
    <xsd:attribute name="dragToRow" type="xsd:boolean" default="true"/>
    <xsd:attribute name="dragToCol" type="xsd:boolean" default="true"/>
    <xsd:attribute name="dragToPage" type="xsd:boolean" default="true"/>
    <xsd:attribute name="dragToData" type="xsd:boolean" default="false"/>
    <xsd:attribute name="dragOff" type="xsd:boolean" default="true"/>
    <xsd:attribute name="includeNewItemsInFilter" type="xsd:boolean" default="false"/>
    <xsd:attribute name="caption" type="s:ST_Xstring" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RowHierarchiesUsage">
    <xsd:sequence>
      <xsd:element name="rowHierarchyUsage" minOccurs="1" maxOccurs="unbounded"
        type="CT_HierarchyUsage"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ColHierarchiesUsage">
    <xsd:sequence>
      <xsd:element name="colHierarchyUsage" minOccurs="1" maxOccurs="unbounded"
        type="CT_HierarchyUsage"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_HierarchyUsage">
    <xsd:attribute name="hierarchyUsage" type="xsd:int" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MemberProperties">
    <xsd:sequence>
      <xsd:element name="mp" maxOccurs="unbounded" type="CT_MemberProperty"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MemberProperty">
    <xsd:attribute name="name" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="showCell" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showTip" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showAsCaption" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="nameLen" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="pPos" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="pLen" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="level" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="field" use="required" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Members">
    <xsd:sequence>
      <xsd:element name="member" maxOccurs="unbounded" type="CT_Member"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
    <xsd:attribute name="level" use="optional" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Member">
    <xsd:attribute name="name" use="required" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Dimensions">
    <xsd:sequence>
      <xsd:element name="dimension" minOccurs="0" maxOccurs="unbounded" type="CT_PivotDimension"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotDimension">
    <xsd:attribute name="measure" type="xsd:boolean" default="false"/>
    <xsd:attribute name="name" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="uniqueName" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="caption" use="required" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MeasureGroups">
    <xsd:sequence>
      <xsd:element name="measureGroup" minOccurs="0" maxOccurs="unbounded" type="CT_MeasureGroup"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MeasureDimensionMaps">
    <xsd:sequence>
      <xsd:element name="map" minOccurs="0" maxOccurs="unbounded" type="CT_MeasureDimensionMap"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MeasureGroup">
    <xsd:attribute name="name" use="required" type="s:ST_Xstring"/>
    <xsd:attribute name="caption" use="required" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MeasureDimensionMap">
    <xsd:attribute name="measureGroup" use="optional" type="xsd:unsignedInt"/>
    <xsd:attribute name="dimension" use="optional" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotTableStyle">
    <xsd:attribute name="name" type="xsd:string"/>
    <xsd:attribute name="showRowHeaders" type="xsd:boolean"/>
    <xsd:attribute name="showColHeaders" type="xsd:boolean"/>
    <xsd:attribute name="showRowStripes" type="xsd:boolean"/>
    <xsd:attribute name="showColStripes" type="xsd:boolean"/>
    <xsd:attribute name="showLastColumn" type="xsd:boolean" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotFilters">
    <xsd:sequence>
      <xsd:element name="filter" minOccurs="0" maxOccurs="unbounded" type="CT_PivotFilter"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotFilter">
    <xsd:sequence>
      <xsd:element name="autoFilter" minOccurs="1" maxOccurs="1" type="CT_AutoFilter"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="fld" use="required" type="xsd:unsignedInt"/>
    <xsd:attribute name="mpFld" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="type" use="required" type="ST_PivotFilterType"/>
    <xsd:attribute name="evalOrder" use="optional" type="xsd:int" default="0"/>
    <xsd:attribute name="id" use="required" type="xsd:unsignedInt"/>
    <xsd:attribute name="iMeasureHier" use="optional" type="xsd:unsignedInt"/>
    <xsd:attribute name="iMeasureFld" use="optional" type="xsd:unsignedInt"/>
    <xsd:attribute name="name" type="s:ST_Xstring"/>
    <xsd:attribute name="description" type="s:ST_Xstring"/>
    <xsd:attribute name="stringValue1" type="s:ST_Xstring"/>
    <xsd:attribute name="stringValue2" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_ShowDataAs">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="normal"/>
      <xsd:enumeration value="difference"/>
      <xsd:enumeration value="percent"/>
      <xsd:enumeration value="percentDiff"/>
      <xsd:enumeration value="runTotal"/>
      <xsd:enumeration value="percentOfRow"/>
      <xsd:enumeration value="percentOfCol"/>
      <xsd:enumeration value="percentOfTotal"/>
      <xsd:enumeration value="index"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ItemType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="data"/>
      <xsd:enumeration value="default"/>
      <xsd:enumeration value="sum"/>
      <xsd:enumeration value="countA"/>
      <xsd:enumeration value="avg"/>
      <xsd:enumeration value="max"/>
      <xsd:enumeration value="min"/>
      <xsd:enumeration value="product"/>
      <xsd:enumeration value="count"/>
      <xsd:enumeration value="stdDev"/>
      <xsd:enumeration value="stdDevP"/>
      <xsd:enumeration value="var"/>
      <xsd:enumeration value="varP"/>
      <xsd:enumeration value="grand"/>
      <xsd:enumeration value="blank"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FormatAction">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="blank"/>
      <xsd:enumeration value="formatting"/>
      <xsd:enumeration value="drill"/>
      <xsd:enumeration value="formula"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FieldSortType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="manual"/>
      <xsd:enumeration value="ascending"/>
      <xsd:enumeration value="descending"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PivotFilterType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="unknown"/>
      <xsd:enumeration value="count"/>
      <xsd:enumeration value="percent"/>
      <xsd:enumeration value="sum"/>
      <xsd:enumeration value="captionEqual"/>
      <xsd:enumeration value="captionNotEqual"/>
      <xsd:enumeration value="captionBeginsWith"/>
      <xsd:enumeration value="captionNotBeginsWith"/>
      <xsd:enumeration value="captionEndsWith"/>
      <xsd:enumeration value="captionNotEndsWith"/>
      <xsd:enumeration value="captionContains"/>
      <xsd:enumeration value="captionNotContains"/>
      <xsd:enumeration value="captionGreaterThan"/>
      <xsd:enumeration value="captionGreaterThanOrEqual"/>
      <xsd:enumeration value="captionLessThan"/>
      <xsd:enumeration value="captionLessThanOrEqual"/>
      <xsd:enumeration value="captionBetween"/>
      <xsd:enumeration value="captionNotBetween"/>
      <xsd:enumeration value="valueEqual"/>
      <xsd:enumeration value="valueNotEqual"/>
      <xsd:enumeration value="valueGreaterThan"/>
      <xsd:enumeration value="valueGreaterThanOrEqual"/>
      <xsd:enumeration value="valueLessThan"/>
      <xsd:enumeration value="valueLessThanOrEqual"/>
      <xsd:enumeration value="valueBetween"/>
      <xsd:enumeration value="valueNotBetween"/>
      <xsd:enumeration value="dateEqual"/>
      <xsd:enumeration value="dateNotEqual"/>
      <xsd:enumeration value="dateOlderThan"/>
      <xsd:enumeration value="dateOlderThanOrEqual"/>
      <xsd:enumeration value="dateNewerThan"/>
      <xsd:enumeration value="dateNewerThanOrEqual"/>
      <xsd:enumeration value="dateBetween"/>
      <xsd:enumeration value="dateNotBetween"/>
      <xsd:enumeration value="tomorrow"/>
      <xsd:enumeration value="today"/>
      <xsd:enumeration value="yesterday"/>
      <xsd:enumeration value="nextWeek"/>
      <xsd:enumeration value="thisWeek"/>
      <xsd:enumeration value="lastWeek"/>
      <xsd:enumeration value="nextMonth"/>
      <xsd:enumeration value="thisMonth"/>
      <xsd:enumeration value="lastMonth"/>
      <xsd:enumeration value="nextQuarter"/>
      <xsd:enumeration value="thisQuarter"/>
      <xsd:enumeration value="lastQuarter"/>
      <xsd:enumeration value="nextYear"/>
      <xsd:enumeration value="thisYear"/>
      <xsd:enumeration value="lastYear"/>
      <xsd:enumeration value="yearToDate"/>
      <xsd:enumeration value="Q1"/>
      <xsd:enumeration value="Q2"/>
      <xsd:enumeration value="Q3"/>
      <xsd:enumeration value="Q4"/>
      <xsd:enumeration value="M1"/>
      <xsd:enumeration value="M2"/>
      <xsd:enumeration value="M3"/>
      <xsd:enumeration value="M4"/>
      <xsd:enumeration value="M5"/>
      <xsd:enumeration value="M6"/>
      <xsd:enumeration value="M7"/>
      <xsd:enumeration value="M8"/>
      <xsd:enumeration value="M9"/>
      <xsd:enumeration value="M10"/>
      <xsd:enumeration value="M11"/>
      <xsd:enumeration value="M12"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PivotArea">
    <xsd:sequence>
      <xsd:element name="references" minOccurs="0" type="CT_PivotAreaReferences"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="field" use="optional" type="xsd:int"/>
    <xsd:attribute name="type" type="ST_PivotAreaType" default="normal"/>
    <xsd:attribute name="dataOnly" type="xsd:boolean" default="true"/>
    <xsd:attribute name="labelOnly" type="xsd:boolean" default="false"/>
    <xsd:attribute name="grandRow" type="xsd:boolean" default="false"/>
    <xsd:attribute name="grandCol" type="xsd:boolean" default="false"/>
    <xsd:attribute name="cacheIndex" type="xsd:boolean" default="false"/>
    <xsd:attribute name="outline" type="xsd:boolean" default="true"/>
    <xsd:attribute name="offset" type="ST_Ref"/>
    <xsd:attribute name="collapsedLevelsAreSubtotals" type="xsd:boolean" default="false"/>
    <xsd:attribute name="axis" type="ST_Axis" use="optional"/>
    <xsd:attribute name="fieldPosition" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PivotAreaType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="normal"/>
      <xsd:enumeration value="data"/>
      <xsd:enumeration value="all"/>
      <xsd:enumeration value="origin"/>
      <xsd:enumeration value="button"/>
      <xsd:enumeration value="topEnd"/>
      <xsd:enumeration value="topRight"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PivotAreaReferences">
    <xsd:sequence>
      <xsd:element name="reference" maxOccurs="unbounded" type="CT_PivotAreaReference"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotAreaReference">
    <xsd:sequence>
      <xsd:element name="x" minOccurs="0" maxOccurs="unbounded" type="CT_Index"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="field" use="optional" type="xsd:unsignedInt"/>
    <xsd:attribute name="count" type="xsd:unsignedInt"/>
    <xsd:attribute name="selected" type="xsd:boolean" default="true"/>
    <xsd:attribute name="byPosition" type="xsd:boolean" default="false"/>
    <xsd:attribute name="relative" type="xsd:boolean" default="false"/>
    <xsd:attribute name="defaultSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="sumSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="countASubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="avgSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="maxSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="minSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="productSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="countSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="stdDevSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="stdDevPSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="varSubtotal" type="xsd:boolean" default="false"/>
    <xsd:attribute name="varPSubtotal" type="xsd:boolean" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Index">
    <xsd:attribute name="v" use="required" type="xsd:unsignedInt"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Axis">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="axisRow"/>
      <xsd:enumeration value="axisCol"/>
      <xsd:enumeration value="axisPage"/>
      <xsd:enumeration value="axisValues"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:element name="queryTable" type="CT_QueryTable"/>
  <xsd:complexType name="CT_QueryTable">
    <xsd:sequence>
      <xsd:element name="queryTableRefresh" type="CT_QueryTableRefresh" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="headers" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="rowNumbers" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="disableRefresh" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="backgroundRefresh" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="firstBackgroundRefresh" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="refreshOnLoad" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="growShrinkType" type="ST_GrowShrinkType" use="optional"
      default="insertDelete"/>
    <xsd:attribute name="fillFormulas" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="removeDataOnSave" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="disableEdit" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="preserveFormatting" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="adjustColumnWidth" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="intermediate" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="connectionId" type="xsd:unsignedInt" use="required"/>
    <xsd:attributeGroup ref="AG_AutoFormat"/>
  </xsd:complexType>
  <xsd:complexType name="CT_QueryTableRefresh">
    <xsd:sequence>
      <xsd:element name="queryTableFields" type="CT_QueryTableFields" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="queryTableDeletedFields" type="CT_QueryTableDeletedFields" minOccurs="0"
        maxOccurs="1"/>
      <xsd:element name="sortState" minOccurs="0" maxOccurs="1" type="CT_SortState"/>
      <xsd:element name="extLst" minOccurs="0" maxOccurs="1" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="preserveSortFilterLayout" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="fieldIdWrapped" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="headersInLastRefresh" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="minimumVersion" type="xsd:unsignedByte" use="optional" default="0"/>
    <xsd:attribute name="nextId" type="xsd:unsignedInt" use="optional" default="1"/>
    <xsd:attribute name="unboundColumnsLeft" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="unboundColumnsRight" type="xsd:unsignedInt" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_QueryTableDeletedFields">
    <xsd:sequence>
      <xsd:element name="deletedField" type="CT_DeletedField" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DeletedField">
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_QueryTableFields">
    <xsd:sequence>
      <xsd:element name="queryTableField" type="CT_QueryTableField" minOccurs="0"
        maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_QueryTableField">
    <xsd:sequence minOccurs="0">
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="id" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="name" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="dataBound" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="rowNumbers" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="fillFormulas" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="clipped" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="tableColumnId" type="xsd:unsignedInt" default="0"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_GrowShrinkType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="insertDelete"/>
      <xsd:enumeration value="insertClear"/>
      <xsd:enumeration value="overwriteClear"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:element name="sst" type="CT_Sst"/>
  <xsd:complexType name="CT_Sst">
    <xsd:sequence>
      <xsd:element name="si" type="CT_Rst" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="uniqueCount" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PhoneticType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="halfwidthKatakana"/>
      <xsd:enumeration value="fullwidthKatakana"/>
      <xsd:enumeration value="Hiragana"/>
      <xsd:enumeration value="noConversion"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PhoneticAlignment">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="noControl"/>
      <xsd:enumeration value="left"/>
      <xsd:enumeration value="center"/>
      <xsd:enumeration value="distributed"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PhoneticRun">
    <xsd:sequence>
      <xsd:element name="t" type="s:ST_Xstring" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="sb" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="eb" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RElt">
    <xsd:sequence>
      <xsd:element name="rPr" type="CT_RPrElt" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="t" type="s:ST_Xstring" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_RPrElt">
    <xsd:choice maxOccurs="unbounded">
      <xsd:element name="rFont" type="CT_FontName" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="charset" type="CT_IntProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="family" type="CT_IntProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="b" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="i" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="strike" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="outline" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="shadow" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="condense" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extend" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="color" type="CT_Color" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sz" type="CT_FontSize" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="u" type="CT_UnderlineProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="vertAlign" type="CT_VerticalAlignFontProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="scheme" type="CT_FontScheme" minOccurs="0" maxOccurs="1"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:complexType name="CT_Rst">
    <xsd:sequence>
      <xsd:element name="t" type="s:ST_Xstring" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="r" type="CT_RElt" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rPh" type="CT_PhoneticRun" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="phoneticPr" minOccurs="0" maxOccurs="1" type="CT_PhoneticPr"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_PhoneticPr">
    <xsd:attribute name="fontId" type="ST_FontId" use="required"/>
    <xsd:attribute name="type" type="ST_PhoneticType" use="optional" default="fullwidthKatakana"/>
    <xsd:attribute name="alignment" type="ST_PhoneticAlignment" use="optional" default="left"/>
  </xsd:complexType>
  <xsd:element name="headers" type="CT_RevisionHeaders"/>
  <xsd:element name="revisions" type="CT_Revisions"/>
  <xsd:complexType name="CT_RevisionHeaders">
    <xsd:sequence>
      <xsd:element name="header" type="CT_RevisionHeader" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="guid" type="s:ST_Guid" use="required"/>
    <xsd:attribute name="lastGuid" type="s:ST_Guid" use="optional"/>
    <xsd:attribute name="shared" type="xsd:boolean" default="true"/>
    <xsd:attribute name="diskRevisions" type="xsd:boolean" default="false"/>
    <xsd:attribute name="history" type="xsd:boolean" default="true"/>
    <xsd:attribute name="trackRevisions" type="xsd:boolean" default="true"/>
    <xsd:attribute name="exclusive" type="xsd:boolean" default="false"/>
    <xsd:attribute name="revisionId" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="version" type="xsd:int" default="1"/>
    <xsd:attribute name="keepChangeHistory" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="protected" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="preserveHistory" type="xsd:unsignedInt" default="30"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Revisions">
    <xsd:choice maxOccurs="unbounded">
      <xsd:element name="rrc" type="CT_RevisionRowColumn" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rm" type="CT_RevisionMove" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rcv" type="CT_RevisionCustomView" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rsnm" type="CT_RevisionSheetRename" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="ris" type="CT_RevisionInsertSheet" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rcc" type="CT_RevisionCellChange" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rfmt" type="CT_RevisionFormatting" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="raf" type="CT_RevisionAutoFormatting" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rdn" type="CT_RevisionDefinedName" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rcmt" type="CT_RevisionComment" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rqt" type="CT_RevisionQueryTableField" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rcft" type="CT_RevisionConflict" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:attributeGroup name="AG_RevData">
    <xsd:attribute name="rId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="ua" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="ra" type="xsd:boolean" use="optional" default="false"/>
  </xsd:attributeGroup>
  <xsd:complexType name="CT_RevisionHeader">
    <xsd:sequence>
      <xsd:element name="sheetIdMap" minOccurs="1" maxOccurs="1" type="CT_SheetIdMap"/>
      <xsd:element name="reviewedList" minOccurs="0" maxOccurs="1" type="CT_ReviewedRevisions"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="guid" type="s:ST_Guid" use="required"/>
    <xsd:attribute name="dateTime" type="xsd:dateTime" use="required"/>
    <xsd:attribute name="maxSheetId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="userName" type="s:ST_Xstring" use="required"/>
    <xsd:attribute ref="r:id" use="required"/>
    <xsd:attribute name="minRId" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="maxRId" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SheetIdMap">
    <xsd:sequence>
      <xsd:element name="sheetId" type="CT_SheetId" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SheetId">
    <xsd:attribute name="val" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ReviewedRevisions">
    <xsd:sequence>
      <xsd:element name="reviewed" type="CT_Reviewed" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Reviewed">
    <xsd:attribute name="rId" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_UndoInfo">
    <xsd:attribute name="index" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="exp" type="ST_FormulaExpression" use="required"/>
    <xsd:attribute name="ref3D" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="array" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="v" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="nf" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="cs" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="dr" type="ST_RefA" use="required"/>
    <xsd:attribute name="dn" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="r" type="ST_CellRef" use="optional"/>
    <xsd:attribute name="sId" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RevisionRowColumn">
    <xsd:choice minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="undo" type="CT_UndoInfo" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rcc" type="CT_RevisionCellChange" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rfmt" type="CT_RevisionFormatting" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
    <xsd:attributeGroup ref="AG_RevData"/>
    <xsd:attribute name="sId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="eol" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="ref" type="ST_Ref" use="required"/>
    <xsd:attribute name="action" type="ST_rwColActionType" use="required"/>
    <xsd:attribute name="edge" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RevisionMove">
    <xsd:choice minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="undo" type="CT_UndoInfo" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rcc" type="CT_RevisionCellChange" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rfmt" type="CT_RevisionFormatting" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
    <xsd:attributeGroup ref="AG_RevData"/>
    <xsd:attribute name="sheetId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="source" type="ST_Ref" use="required"/>
    <xsd:attribute name="destination" type="ST_Ref" use="required"/>
    <xsd:attribute name="sourceSheetId" type="xsd:unsignedInt" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RevisionCustomView">
    <xsd:attribute name="guid" type="s:ST_Guid" use="required"/>
    <xsd:attribute name="action" type="ST_RevisionAction" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RevisionSheetRename">
    <xsd:sequence>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_RevData"/>
    <xsd:attribute name="sheetId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="oldName" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="newName" type="s:ST_Xstring" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RevisionInsertSheet">
    <xsd:attributeGroup ref="AG_RevData"/>
    <xsd:attribute name="sheetId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="sheetPosition" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RevisionCellChange">
    <xsd:sequence>
      <xsd:element name="oc" type="CT_Cell" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="nc" type="CT_Cell" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="odxf" type="CT_Dxf" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="ndxf" type="CT_Dxf" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_RevData"/>
    <xsd:attribute name="sId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="odxf" type="xsd:boolean" default="false"/>
    <xsd:attribute name="xfDxf" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="s" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="dxf" type="xsd:boolean" default="false"/>
    <xsd:attribute name="numFmtId" type="ST_NumFmtId" use="optional"/>
    <xsd:attribute name="quotePrefix" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="oldQuotePrefix" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="ph" type="xsd:boolean" default="false"/>
    <xsd:attribute name="oldPh" type="xsd:boolean" default="false"/>
    <xsd:attribute name="endOfListFormulaUpdate" type="xsd:boolean" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RevisionFormatting">
    <xsd:sequence>
      <xsd:element name="dxf" type="CT_Dxf" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="sheetId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="xfDxf" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="s" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="sqref" type="ST_Sqref" use="required"/>
    <xsd:attribute name="start" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="length" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RevisionAutoFormatting">
    <xsd:attribute name="sheetId" type="xsd:unsignedInt" use="required"/>
    <xsd:attributeGroup ref="AG_AutoFormat"/>
    <xsd:attribute name="ref" type="ST_Ref" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RevisionComment">
    <xsd:attribute name="sheetId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="cell" type="ST_CellRef" use="required"/>
    <xsd:attribute name="guid" type="s:ST_Guid" use="required"/>
    <xsd:attribute name="action" type="ST_RevisionAction" default="add"/>
    <xsd:attribute name="alwaysShow" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="old" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="hiddenRow" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="hiddenColumn" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="author" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="oldLength" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="newLength" type="xsd:unsignedInt" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RevisionDefinedName">
    <xsd:sequence>
      <xsd:element name="formula" type="ST_Formula" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="oldFormula" type="ST_Formula" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_RevData"/>
    <xsd:attribute name="localSheetId" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="customView" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="function" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="oldFunction" type="xsd:boolean" default="false"/>
    <xsd:attribute name="functionGroupId" type="xsd:unsignedByte" use="optional"/>
    <xsd:attribute name="oldFunctionGroupId" type="xsd:unsignedByte" use="optional"/>
    <xsd:attribute name="shortcutKey" type="xsd:unsignedByte" use="optional"/>
    <xsd:attribute name="oldShortcutKey" type="xsd:unsignedByte" use="optional"/>
    <xsd:attribute name="hidden" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="oldHidden" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="customMenu" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="oldCustomMenu" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="description" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="oldDescription" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="help" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="oldHelp" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="statusBar" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="oldStatusBar" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="comment" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="oldComment" type="s:ST_Xstring" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RevisionConflict">
    <xsd:attributeGroup ref="AG_RevData"/>
    <xsd:attribute name="sheetId" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RevisionQueryTableField">
    <xsd:attribute name="sheetId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="ref" type="ST_Ref" use="required"/>
    <xsd:attribute name="fieldId" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_rwColActionType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="insertRow"/>
      <xsd:enumeration value="deleteRow"/>
      <xsd:enumeration value="insertCol"/>
      <xsd:enumeration value="deleteCol"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_RevisionAction">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="add"/>
      <xsd:enumeration value="delete"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FormulaExpression">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="ref"/>
      <xsd:enumeration value="refError"/>
      <xsd:enumeration value="area"/>
      <xsd:enumeration value="areaError"/>
      <xsd:enumeration value="computedArea"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:element name="users" type="CT_Users"/>
  <xsd:complexType name="CT_Users">
    <xsd:sequence>
      <xsd:element name="userInfo" minOccurs="0" maxOccurs="256" type="CT_SharedUser"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SharedUser">
    <xsd:sequence>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="guid" type="s:ST_Guid" use="required"/>
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="id" type="xsd:int" use="required"/>
    <xsd:attribute name="dateTime" type="xsd:dateTime" use="required"/>
  </xsd:complexType>
  <xsd:element name="worksheet" type="CT_Worksheet"/>
  <xsd:element name="chartsheet" type="CT_Chartsheet"/>
  <xsd:element name="dialogsheet" type="CT_Dialogsheet"/>
  <xsd:complexType name="CT_Macrosheet">
    <xsd:sequence>
      <xsd:element name="sheetPr" type="CT_SheetPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="dimension" type="CT_SheetDimension" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sheetViews" type="CT_SheetViews" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sheetFormatPr" type="CT_SheetFormatPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="cols" type="CT_Cols" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="sheetData" type="CT_SheetData" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="sheetProtection" type="CT_SheetProtection" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="autoFilter" type="CT_AutoFilter" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sortState" type="CT_SortState" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="dataConsolidate" type="CT_DataConsolidate" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="customSheetViews" type="CT_CustomSheetViews" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="phoneticPr" type="CT_PhoneticPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="conditionalFormatting" type="CT_ConditionalFormatting" minOccurs="0"
        maxOccurs="unbounded"/>
      <xsd:element name="printOptions" type="CT_PrintOptions" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="pageMargins" type="CT_PageMargins" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="pageSetup" type="CT_PageSetup" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="headerFooter" type="CT_HeaderFooter" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="rowBreaks" type="CT_PageBreak" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="colBreaks" type="CT_PageBreak" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="customProperties" type="CT_CustomProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="drawing" type="CT_Drawing" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="legacyDrawing" type="CT_LegacyDrawing" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="legacyDrawingHF" type="CT_LegacyDrawing" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="drawingHF" type="CT_DrawingHF" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="picture" type="CT_SheetBackgroundPicture" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="oleObjects" type="CT_OleObjects" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Dialogsheet">
    <xsd:sequence>
      <xsd:element name="sheetPr" minOccurs="0" type="CT_SheetPr"/>
      <xsd:element name="sheetViews" minOccurs="0" type="CT_SheetViews"/>
      <xsd:element name="sheetFormatPr" minOccurs="0" type="CT_SheetFormatPr"/>
      <xsd:element name="sheetProtection" type="CT_SheetProtection" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="customSheetViews" minOccurs="0" type="CT_CustomSheetViews"/>
      <xsd:element name="printOptions" minOccurs="0" type="CT_PrintOptions"/>
      <xsd:element name="pageMargins" minOccurs="0" type="CT_PageMargins"/>
      <xsd:element name="pageSetup" minOccurs="0" type="CT_PageSetup"/>
      <xsd:element name="headerFooter" minOccurs="0" type="CT_HeaderFooter"/>
      <xsd:element name="drawing" minOccurs="0" type="CT_Drawing"/>
      <xsd:element name="legacyDrawing" minOccurs="0" type="CT_LegacyDrawing"/>
      <xsd:element name="legacyDrawingHF" type="CT_LegacyDrawing" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="drawingHF" type="CT_DrawingHF" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="oleObjects" type="CT_OleObjects" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="controls" type="CT_Controls" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Worksheet">
    <xsd:sequence>
      <xsd:element name="sheetPr" type="CT_SheetPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="dimension" type="CT_SheetDimension" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sheetViews" type="CT_SheetViews" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sheetFormatPr" type="CT_SheetFormatPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="cols" type="CT_Cols" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="sheetData" type="CT_SheetData" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="sheetCalcPr" type="CT_SheetCalcPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sheetProtection" type="CT_SheetProtection" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="protectedRanges" type="CT_ProtectedRanges" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="scenarios" type="CT_Scenarios" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="autoFilter" type="CT_AutoFilter" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sortState" type="CT_SortState" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="dataConsolidate" type="CT_DataConsolidate" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="customSheetViews" type="CT_CustomSheetViews" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="mergeCells" type="CT_MergeCells" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="phoneticPr" type="CT_PhoneticPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="conditionalFormatting" type="CT_ConditionalFormatting" minOccurs="0"
        maxOccurs="unbounded"/>
      <xsd:element name="dataValidations" type="CT_DataValidations" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="hyperlinks" type="CT_Hyperlinks" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="printOptions" type="CT_PrintOptions" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="pageMargins" type="CT_PageMargins" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="pageSetup" type="CT_PageSetup" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="headerFooter" type="CT_HeaderFooter" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="rowBreaks" type="CT_PageBreak" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="colBreaks" type="CT_PageBreak" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="customProperties" type="CT_CustomProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="cellWatches" type="CT_CellWatches" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="ignoredErrors" type="CT_IgnoredErrors" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="smartTags" type="CT_SmartTags" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="drawing" type="CT_Drawing" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="legacyDrawing" type="CT_LegacyDrawing" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="legacyDrawingHF" type="CT_LegacyDrawing" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="drawingHF" type="CT_DrawingHF" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="picture" type="CT_SheetBackgroundPicture" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="oleObjects" type="CT_OleObjects" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="controls" type="CT_Controls" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="webPublishItems" type="CT_WebPublishItems" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tableParts" type="CT_TableParts" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_SheetData">
    <xsd:sequence>
      <xsd:element name="row" type="CT_Row" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_SheetCalcPr">
    <xsd:attribute name="fullCalcOnLoad" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SheetFormatPr">
    <xsd:attribute name="baseColWidth" type="xsd:unsignedInt" use="optional" default="8"/>
    <xsd:attribute name="defaultColWidth" type="xsd:double" use="optional"/>
    <xsd:attribute name="defaultRowHeight" type="xsd:double" use="required"/>
    <xsd:attribute name="customHeight" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="zeroHeight" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="thickTop" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="thickBottom" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="outlineLevelRow" type="xsd:unsignedByte" use="optional" default="0"/>
    <xsd:attribute name="outlineLevelCol" type="xsd:unsignedByte" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Cols">
    <xsd:sequence>
      <xsd:element name="col" type="CT_Col" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Col">
    <xsd:attribute name="min" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="max" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="width" type="xsd:double" use="optional"/>
    <xsd:attribute name="style" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="hidden" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="bestFit" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="customWidth" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="phonetic" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="outlineLevel" type="xsd:unsignedByte" use="optional" default="0"/>
    <xsd:attribute name="collapsed" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_CellSpan">
    <xsd:restriction base="xsd:string"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_CellSpans">
    <xsd:list itemType="ST_CellSpan"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_Row">
    <xsd:sequence>
      <xsd:element name="c" type="CT_Cell" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="r" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="spans" type="ST_CellSpans" use="optional"/>
    <xsd:attribute name="s" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="customFormat" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="ht" type="xsd:double" use="optional"/>
    <xsd:attribute name="hidden" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="customHeight" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="outlineLevel" type="xsd:unsignedByte" use="optional" default="0"/>
    <xsd:attribute name="collapsed" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="thickTop" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="thickBot" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="ph" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Cell">
    <xsd:sequence>
      <xsd:element name="f" type="CT_CellFormula" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="v" type="s:ST_Xstring" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="is" type="CT_Rst" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="r" type="ST_CellRef" use="optional"/>
    <xsd:attribute name="s" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="t" type="ST_CellType" use="optional" default="n"/>
    <xsd:attribute name="cm" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="vm" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="ph" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_CellType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="b"/>
      <xsd:enumeration value="n"/>
      <xsd:enumeration value="e"/>
      <xsd:enumeration value="s"/>
      <xsd:enumeration value="str"/>
      <xsd:enumeration value="inlineStr"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_CellFormulaType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="normal"/>
      <xsd:enumeration value="array"/>
      <xsd:enumeration value="dataTable"/>
      <xsd:enumeration value="shared"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_SheetPr">
    <xsd:sequence>
      <xsd:element name="tabColor" type="CT_Color" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="outlinePr" type="CT_OutlinePr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="pageSetUpPr" type="CT_PageSetUpPr" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="syncHorizontal" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="syncVertical" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="syncRef" type="ST_Ref" use="optional"/>
    <xsd:attribute name="transitionEvaluation" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="transitionEntry" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="published" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="codeName" type="xsd:string" use="optional"/>
    <xsd:attribute name="filterMode" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="enableFormatConditionsCalculation" type="xsd:boolean" use="optional"
      default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SheetDimension">
    <xsd:attribute name="ref" type="ST_Ref" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SheetViews">
    <xsd:sequence>
      <xsd:element name="sheetView" type="CT_SheetView" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_SheetView">
    <xsd:sequence>
      <xsd:element name="pane" type="CT_Pane" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="selection" type="CT_Selection" minOccurs="0" maxOccurs="4"/>
      <xsd:element name="pivotSelection" type="CT_PivotSelection" minOccurs="0" maxOccurs="4"/>
      <xsd:element name="extLst" minOccurs="0" maxOccurs="1" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="windowProtection" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showFormulas" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showGridLines" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="showRowColHeaders" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="showZeros" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="rightToLeft" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="tabSelected" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showRuler" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="showOutlineSymbols" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="defaultGridColor" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="showWhiteSpace" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="view" type="ST_SheetViewType" use="optional" default="normal"/>
    <xsd:attribute name="topLeftCell" type="ST_CellRef" use="optional"/>
    <xsd:attribute name="colorId" type="xsd:unsignedInt" use="optional" default="64"/>
    <xsd:attribute name="zoomScale" type="xsd:unsignedInt" use="optional" default="100"/>
    <xsd:attribute name="zoomScaleNormal" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="zoomScaleSheetLayoutView" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="zoomScalePageLayoutView" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="workbookViewId" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Pane">
    <xsd:attribute name="xSplit" type="xsd:double" use="optional" default="0"/>
    <xsd:attribute name="ySplit" type="xsd:double" use="optional" default="0"/>
    <xsd:attribute name="topLeftCell" type="ST_CellRef" use="optional"/>
    <xsd:attribute name="activePane" type="ST_Pane" use="optional" default="topLeft"/>
    <xsd:attribute name="state" type="ST_PaneState" use="optional" default="split"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotSelection">
    <xsd:sequence>
      <xsd:element name="pivotArea" type="CT_PivotArea"/>
    </xsd:sequence>
    <xsd:attribute name="pane" type="ST_Pane" use="optional" default="topLeft"/>
    <xsd:attribute name="showHeader" type="xsd:boolean" default="false"/>
    <xsd:attribute name="label" type="xsd:boolean" default="false"/>
    <xsd:attribute name="data" type="xsd:boolean" default="false"/>
    <xsd:attribute name="extendable" type="xsd:boolean" default="false"/>
    <xsd:attribute name="count" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="axis" type="ST_Axis" use="optional"/>
    <xsd:attribute name="dimension" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="start" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="min" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="max" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="activeRow" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="activeCol" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="previousRow" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="previousCol" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute name="click" type="xsd:unsignedInt" default="0"/>
    <xsd:attribute ref="r:id" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Selection">
    <xsd:attribute name="pane" type="ST_Pane" use="optional" default="topLeft"/>
    <xsd:attribute name="activeCell" type="ST_CellRef" use="optional"/>
    <xsd:attribute name="activeCellId" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="sqref" type="ST_Sqref" use="optional" default="A1"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Pane">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="bottomRight"/>
      <xsd:enumeration value="topRight"/>
      <xsd:enumeration value="bottomLeft"/>
      <xsd:enumeration value="topLeft"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PageBreak">
    <xsd:sequence>
      <xsd:element name="brk" type="CT_Break" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="manualBreakCount" type="xsd:unsignedInt" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Break">
    <xsd:attribute name="id" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="min" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="max" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="man" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="pt" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_SheetViewType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="normal"/>
      <xsd:enumeration value="pageBreakPreview"/>
      <xsd:enumeration value="pageLayout"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_OutlinePr">
    <xsd:attribute name="applyStyles" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="summaryBelow" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="summaryRight" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="showOutlineSymbols" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PageSetUpPr">
    <xsd:attribute name="autoPageBreaks" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="fitToPage" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DataConsolidate">
    <xsd:sequence>
      <xsd:element name="dataRefs" type="CT_DataRefs" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="function" type="ST_DataConsolidateFunction" use="optional" default="sum"/>
    <xsd:attribute name="startLabels" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="leftLabels" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="topLabels" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="link" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DataConsolidateFunction">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="average"/>
      <xsd:enumeration value="count"/>
      <xsd:enumeration value="countNums"/>
      <xsd:enumeration value="max"/>
      <xsd:enumeration value="min"/>
      <xsd:enumeration value="product"/>
      <xsd:enumeration value="stdDev"/>
      <xsd:enumeration value="stdDevp"/>
      <xsd:enumeration value="sum"/>
      <xsd:enumeration value="var"/>
      <xsd:enumeration value="varp"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_DataRefs">
    <xsd:sequence>
      <xsd:element name="dataRef" type="CT_DataRef" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DataRef">
    <xsd:attribute name="ref" type="ST_Ref" use="optional"/>
    <xsd:attribute name="name" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="sheet" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute ref="r:id" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MergeCells">
    <xsd:sequence>
      <xsd:element name="mergeCell" type="CT_MergeCell" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MergeCell">
    <xsd:attribute name="ref" type="ST_Ref" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SmartTags">
    <xsd:sequence>
      <xsd:element name="cellSmartTags" type="CT_CellSmartTags" minOccurs="1" maxOccurs="unbounded"
      />
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_CellSmartTags">
    <xsd:sequence>
      <xsd:element name="cellSmartTag" type="CT_CellSmartTag" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="r" type="ST_CellRef" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CellSmartTag">
    <xsd:sequence>
      <xsd:element name="cellSmartTagPr" minOccurs="0" maxOccurs="unbounded"
        type="CT_CellSmartTagPr"/>
    </xsd:sequence>
    <xsd:attribute name="type" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="deleted" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="xmlBased" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CellSmartTagPr">
    <xsd:attribute name="key" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="val" type="s:ST_Xstring" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Drawing">
    <xsd:attribute ref="r:id" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_LegacyDrawing">
    <xsd:attribute ref="r:id" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DrawingHF">
    <xsd:attribute ref="r:id" use="required"/>
    <xsd:attribute name="lho" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="lhe" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="lhf" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="cho" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="che" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="chf" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="rho" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="rhe" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="rhf" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="lfo" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="lfe" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="lff" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="cfo" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="cfe" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="cff" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="rfo" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="rfe" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="rff" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomSheetViews">
    <xsd:sequence>
      <xsd:element name="customSheetView" minOccurs="1" maxOccurs="unbounded"
        type="CT_CustomSheetView"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomSheetView">
    <xsd:sequence>
      <xsd:element name="pane" type="CT_Pane" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="selection" type="CT_Selection" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="rowBreaks" type="CT_PageBreak" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="colBreaks" type="CT_PageBreak" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="pageMargins" type="CT_PageMargins" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="printOptions" type="CT_PrintOptions" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="pageSetup" type="CT_PageSetup" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="headerFooter" type="CT_HeaderFooter" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="autoFilter" type="CT_AutoFilter" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="guid" type="s:ST_Guid" use="required"/>
    <xsd:attribute name="scale" type="xsd:unsignedInt" default="100"/>
    <xsd:attribute name="colorId" type="xsd:unsignedInt" default="64"/>
    <xsd:attribute name="showPageBreaks" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showFormulas" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showGridLines" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="showRowCol" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="outlineSymbols" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="zeroValues" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="fitToPage" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="printArea" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="filter" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showAutoFilter" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="hiddenRows" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="hiddenColumns" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="state" type="ST_SheetState" default="visible"/>
    <xsd:attribute name="filterUnique" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="view" type="ST_SheetViewType" default="normal"/>
    <xsd:attribute name="showRuler" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="topLeftCell" type="ST_CellRef" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DataValidations">
    <xsd:sequence>
      <xsd:element name="dataValidation" type="CT_DataValidation" minOccurs="1"
        maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="disablePrompts" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="xWindow" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="yWindow" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DataValidation">
    <xsd:sequence>
      <xsd:element name="formula1" type="ST_Formula" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="formula2" type="ST_Formula" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="type" type="ST_DataValidationType" use="optional" default="none"/>
    <xsd:attribute name="errorStyle" type="ST_DataValidationErrorStyle" use="optional"
      default="stop"/>
    <xsd:attribute name="imeMode" type="ST_DataValidationImeMode" use="optional" default="noControl"/>
    <xsd:attribute name="operator" type="ST_DataValidationOperator" use="optional" default="between"/>
    <xsd:attribute name="allowBlank" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showDropDown" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showInputMessage" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showErrorMessage" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="errorTitle" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="error" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="promptTitle" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="prompt" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="sqref" type="ST_Sqref" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DataValidationType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="whole"/>
      <xsd:enumeration value="decimal"/>
      <xsd:enumeration value="list"/>
      <xsd:enumeration value="date"/>
      <xsd:enumeration value="time"/>
      <xsd:enumeration value="textLength"/>
      <xsd:enumeration value="custom"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_DataValidationOperator">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="between"/>
      <xsd:enumeration value="notBetween"/>
      <xsd:enumeration value="equal"/>
      <xsd:enumeration value="notEqual"/>
      <xsd:enumeration value="lessThan"/>
      <xsd:enumeration value="lessThanOrEqual"/>
      <xsd:enumeration value="greaterThan"/>
      <xsd:enumeration value="greaterThanOrEqual"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_DataValidationErrorStyle">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="stop"/>
      <xsd:enumeration value="warning"/>
      <xsd:enumeration value="information"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_DataValidationImeMode">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="noControl"/>
      <xsd:enumeration value="off"/>
      <xsd:enumeration value="on"/>
      <xsd:enumeration value="disabled"/>
      <xsd:enumeration value="hiragana"/>
      <xsd:enumeration value="fullKatakana"/>
      <xsd:enumeration value="halfKatakana"/>
      <xsd:enumeration value="fullAlpha"/>
      <xsd:enumeration value="halfAlpha"/>
      <xsd:enumeration value="fullHangul"/>
      <xsd:enumeration value="halfHangul"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_CfType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="expression"/>
      <xsd:enumeration value="cellIs"/>
      <xsd:enumeration value="colorScale"/>
      <xsd:enumeration value="dataBar"/>
      <xsd:enumeration value="iconSet"/>
      <xsd:enumeration value="top10"/>
      <xsd:enumeration value="uniqueValues"/>
      <xsd:enumeration value="duplicateValues"/>
      <xsd:enumeration value="containsText"/>
      <xsd:enumeration value="notContainsText"/>
      <xsd:enumeration value="beginsWith"/>
      <xsd:enumeration value="endsWith"/>
      <xsd:enumeration value="containsBlanks"/>
      <xsd:enumeration value="notContainsBlanks"/>
      <xsd:enumeration value="containsErrors"/>
      <xsd:enumeration value="notContainsErrors"/>
      <xsd:enumeration value="timePeriod"/>
      <xsd:enumeration value="aboveAverage"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TimePeriod">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="today"/>
      <xsd:enumeration value="yesterday"/>
      <xsd:enumeration value="tomorrow"/>
      <xsd:enumeration value="last7Days"/>
      <xsd:enumeration value="thisMonth"/>
      <xsd:enumeration value="lastMonth"/>
      <xsd:enumeration value="nextMonth"/>
      <xsd:enumeration value="thisWeek"/>
      <xsd:enumeration value="lastWeek"/>
      <xsd:enumeration value="nextWeek"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ConditionalFormattingOperator">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="lessThan"/>
      <xsd:enumeration value="lessThanOrEqual"/>
      <xsd:enumeration value="equal"/>
      <xsd:enumeration value="notEqual"/>
      <xsd:enumeration value="greaterThanOrEqual"/>
      <xsd:enumeration value="greaterThan"/>
      <xsd:enumeration value="between"/>
      <xsd:enumeration value="notBetween"/>
      <xsd:enumeration value="containsText"/>
      <xsd:enumeration value="notContains"/>
      <xsd:enumeration value="beginsWith"/>
      <xsd:enumeration value="endsWith"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_CfvoType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="num"/>
      <xsd:enumeration value="percent"/>
      <xsd:enumeration value="max"/>
      <xsd:enumeration value="min"/>
      <xsd:enumeration value="formula"/>
      <xsd:enumeration value="percentile"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_ConditionalFormatting">
    <xsd:sequence>
      <xsd:element name="cfRule" type="CT_CfRule" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="pivot" type="xsd:boolean" default="false"/>
    <xsd:attribute name="sqref" type="ST_Sqref"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CfRule">
    <xsd:sequence>
      <xsd:element name="formula" type="ST_Formula" minOccurs="0" maxOccurs="3"/>
      <xsd:element name="colorScale" type="CT_ColorScale" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="dataBar" type="CT_DataBar" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="iconSet" type="CT_IconSet" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="type" type="ST_CfType"/>
    <xsd:attribute name="dxfId" type="ST_DxfId" use="optional"/>
    <xsd:attribute name="priority" type="xsd:int" use="required"/>
    <xsd:attribute name="stopIfTrue" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="aboveAverage" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="percent" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="bottom" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="operator" type="ST_ConditionalFormattingOperator" use="optional"/>
    <xsd:attribute name="text" type="xsd:string" use="optional"/>
    <xsd:attribute name="timePeriod" type="ST_TimePeriod" use="optional"/>
    <xsd:attribute name="rank" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="stdDev" type="xsd:int" use="optional"/>
    <xsd:attribute name="equalAverage" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Hyperlinks">
    <xsd:sequence>
      <xsd:element name="hyperlink" type="CT_Hyperlink" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Hyperlink">
    <xsd:attribute name="ref" type="ST_Ref" use="required"/>
    <xsd:attribute ref="r:id" use="optional"/>
    <xsd:attribute name="location" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="tooltip" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="display" type="s:ST_Xstring" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CellFormula">
    <xsd:simpleContent>
      <xsd:extension base="ST_Formula">
        <xsd:attribute name="t" type="ST_CellFormulaType" use="optional" default="normal"/>
        <xsd:attribute name="aca" type="xsd:boolean" use="optional" default="false"/>
        <xsd:attribute name="ref" type="ST_Ref" use="optional"/>
        <xsd:attribute name="dt2D" type="xsd:boolean" use="optional" default="false"/>
        <xsd:attribute name="dtr" type="xsd:boolean" use="optional" default="false"/>
        <xsd:attribute name="del1" type="xsd:boolean" use="optional" default="false"/>
        <xsd:attribute name="del2" type="xsd:boolean" use="optional" default="false"/>
        <xsd:attribute name="r1" type="ST_CellRef" use="optional"/>
        <xsd:attribute name="r2" type="ST_CellRef" use="optional"/>
        <xsd:attribute name="ca" type="xsd:boolean" use="optional" default="false"/>
        <xsd:attribute name="si" type="xsd:unsignedInt" use="optional"/>
        <xsd:attribute name="bx" type="xsd:boolean" use="optional" default="false"/>
      </xsd:extension>
    </xsd:simpleContent>
  </xsd:complexType>
  <xsd:complexType name="CT_ColorScale">
    <xsd:sequence>
      <xsd:element name="cfvo" type="CT_Cfvo" minOccurs="2" maxOccurs="unbounded"/>
      <xsd:element name="color" type="CT_Color" minOccurs="2" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_DataBar">
    <xsd:sequence>
      <xsd:element name="cfvo" type="CT_Cfvo" minOccurs="2" maxOccurs="2"/>
      <xsd:element name="color" type="CT_Color" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="minLength" type="xsd:unsignedInt" use="optional" default="10"/>
    <xsd:attribute name="maxLength" type="xsd:unsignedInt" use="optional" default="90"/>
    <xsd:attribute name="showValue" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_IconSet">
    <xsd:sequence>
      <xsd:element name="cfvo" type="CT_Cfvo" minOccurs="2" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="iconSet" type="ST_IconSetType" use="optional" default="3TrafficLights1"/>
    <xsd:attribute name="showValue" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="percent" type="xsd:boolean" default="true"/>
    <xsd:attribute name="reverse" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Cfvo">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="type" type="ST_CfvoType" use="required"/>
    <xsd:attribute name="val" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="gte" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PageMargins">
    <xsd:attribute name="left" type="xsd:double" use="required"/>
    <xsd:attribute name="right" type="xsd:double" use="required"/>
    <xsd:attribute name="top" type="xsd:double" use="required"/>
    <xsd:attribute name="bottom" type="xsd:double" use="required"/>
    <xsd:attribute name="header" type="xsd:double" use="required"/>
    <xsd:attribute name="footer" type="xsd:double" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PrintOptions">
    <xsd:attribute name="horizontalCentered" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="verticalCentered" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="headings" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="gridLines" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="gridLinesSet" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PageSetup">
    <xsd:attribute name="paperSize" type="xsd:unsignedInt" use="optional" default="1"/>
    <xsd:attribute name="paperHeight" type="s:ST_PositiveUniversalMeasure" use="optional"/>
    <xsd:attribute name="paperWidth" type="s:ST_PositiveUniversalMeasure" use="optional"/>
    <xsd:attribute name="scale" type="xsd:unsignedInt" use="optional" default="100"/>
    <xsd:attribute name="firstPageNumber" type="xsd:unsignedInt" use="optional" default="1"/>
    <xsd:attribute name="fitToWidth" type="xsd:unsignedInt" use="optional" default="1"/>
    <xsd:attribute name="fitToHeight" type="xsd:unsignedInt" use="optional" default="1"/>
    <xsd:attribute name="pageOrder" type="ST_PageOrder" use="optional" default="downThenOver"/>
    <xsd:attribute name="orientation" type="ST_Orientation" use="optional" default="default"/>
    <xsd:attribute name="usePrinterDefaults" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="blackAndWhite" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="draft" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="cellComments" type="ST_CellComments" use="optional" default="none"/>
    <xsd:attribute name="useFirstPageNumber" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="errors" type="ST_PrintError" use="optional" default="displayed"/>
    <xsd:attribute name="horizontalDpi" type="xsd:unsignedInt" use="optional" default="600"/>
    <xsd:attribute name="verticalDpi" type="xsd:unsignedInt" use="optional" default="600"/>
    <xsd:attribute name="copies" type="xsd:unsignedInt" use="optional" default="1"/>
    <xsd:attribute ref="r:id" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PageOrder">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="downThenOver"/>
      <xsd:enumeration value="overThenDown"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Orientation">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="default"/>
      <xsd:enumeration value="portrait"/>
      <xsd:enumeration value="landscape"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_CellComments">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="asDisplayed"/>
      <xsd:enumeration value="atEnd"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_HeaderFooter">
    <xsd:sequence>
      <xsd:element name="oddHeader" type="s:ST_Xstring" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="oddFooter" type="s:ST_Xstring" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="evenHeader" type="s:ST_Xstring" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="evenFooter" type="s:ST_Xstring" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="firstHeader" type="s:ST_Xstring" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="firstFooter" type="s:ST_Xstring" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="differentOddEven" type="xsd:boolean" default="false"/>
    <xsd:attribute name="differentFirst" type="xsd:boolean" default="false"/>
    <xsd:attribute name="scaleWithDoc" type="xsd:boolean" default="true"/>
    <xsd:attribute name="alignWithMargins" type="xsd:boolean" default="true"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PrintError">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="displayed"/>
      <xsd:enumeration value="blank"/>
      <xsd:enumeration value="dash"/>
      <xsd:enumeration value="NA"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Scenarios">
    <xsd:sequence>
      <xsd:element name="scenario" type="CT_Scenario" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="current" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="show" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="sqref" type="ST_Sqref" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SheetProtection">
    <xsd:attribute name="password" type="ST_UnsignedShortHex" use="optional"/>
    <xsd:attribute name="algorithmName" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="hashValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="saltValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="spinCount" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="sheet" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="objects" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="scenarios" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="formatCells" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="formatColumns" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="formatRows" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="insertColumns" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="insertRows" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="insertHyperlinks" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="deleteColumns" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="deleteRows" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="selectLockedCells" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="sort" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="autoFilter" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="pivotTables" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="selectUnlockedCells" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ProtectedRanges">
    <xsd:sequence>
      <xsd:element name="protectedRange" type="CT_ProtectedRange" minOccurs="1"
        maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ProtectedRange">
    <xsd:sequence>
      <xsd:element name="securityDescriptor" type="xsd:string" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="password" type="ST_UnsignedShortHex" use="optional"/>
    <xsd:attribute name="sqref" type="ST_Sqref" use="required"/>
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="securityDescriptor" type="xsd:string" use="optional"/>
    <xsd:attribute name="algorithmName" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="hashValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="saltValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="spinCount" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Scenario">
    <xsd:sequence>
      <xsd:element name="inputCells" type="CT_InputCells" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="locked" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="hidden" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="user" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="comment" type="s:ST_Xstring" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_InputCells">
    <xsd:attribute name="r" type="ST_CellRef" use="required"/>
    <xsd:attribute name="deleted" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="undone" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="val" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="numFmtId" type="ST_NumFmtId" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CellWatches">
    <xsd:sequence>
      <xsd:element name="cellWatch" type="CT_CellWatch" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_CellWatch">
    <xsd:attribute name="r" type="ST_CellRef" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Chartsheet">
    <xsd:sequence>
      <xsd:element name="sheetPr" type="CT_ChartsheetPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sheetViews" type="CT_ChartsheetViews" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="sheetProtection" type="CT_ChartsheetProtection" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="customSheetViews" type="CT_CustomChartsheetViews" minOccurs="0"
        maxOccurs="1"/>
      <xsd:element name="pageMargins" minOccurs="0" type="CT_PageMargins"/>
      <xsd:element name="pageSetup" type="CT_CsPageSetup" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="headerFooter" minOccurs="0" type="CT_HeaderFooter"/>
      <xsd:element name="drawing" type="CT_Drawing" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="legacyDrawing" type="CT_LegacyDrawing" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="legacyDrawingHF" type="CT_LegacyDrawing" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="drawingHF" type="CT_DrawingHF" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="picture" type="CT_SheetBackgroundPicture" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="webPublishItems" type="CT_WebPublishItems" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ChartsheetPr">
    <xsd:sequence>
      <xsd:element name="tabColor" type="CT_Color" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="published" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="codeName" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ChartsheetViews">
    <xsd:sequence>
      <xsd:element name="sheetView" type="CT_ChartsheetView" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ChartsheetView">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="tabSelected" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="zoomScale" type="xsd:unsignedInt" default="100" use="optional"/>
    <xsd:attribute name="workbookViewId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="zoomToFit" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ChartsheetProtection">
    <xsd:attribute name="password" type="ST_UnsignedShortHex" use="optional"/>
    <xsd:attribute name="algorithmName" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="hashValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="saltValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="spinCount" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="content" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="objects" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CsPageSetup">
    <xsd:attribute name="paperSize" type="xsd:unsignedInt" use="optional" default="1"/>
    <xsd:attribute name="paperHeight" type="s:ST_PositiveUniversalMeasure" use="optional"/>
    <xsd:attribute name="paperWidth" type="s:ST_PositiveUniversalMeasure" use="optional"/>
    <xsd:attribute name="firstPageNumber" type="xsd:unsignedInt" use="optional" default="1"/>
    <xsd:attribute name="orientation" type="ST_Orientation" use="optional" default="default"/>
    <xsd:attribute name="usePrinterDefaults" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="blackAndWhite" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="draft" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="useFirstPageNumber" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="horizontalDpi" type="xsd:unsignedInt" use="optional" default="600"/>
    <xsd:attribute name="verticalDpi" type="xsd:unsignedInt" use="optional" default="600"/>
    <xsd:attribute name="copies" type="xsd:unsignedInt" use="optional" default="1"/>
    <xsd:attribute ref="r:id" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomChartsheetViews">
    <xsd:sequence>
      <xsd:element name="customSheetView" minOccurs="0" maxOccurs="unbounded"
        type="CT_CustomChartsheetView"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomChartsheetView">
    <xsd:sequence>
      <xsd:element name="pageMargins" type="CT_PageMargins" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="pageSetup" type="CT_CsPageSetup" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="headerFooter" type="CT_HeaderFooter" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="guid" type="s:ST_Guid" use="required"/>
    <xsd:attribute name="scale" type="xsd:unsignedInt" default="100"/>
    <xsd:attribute name="state" type="ST_SheetState" default="visible"/>
    <xsd:attribute name="zoomToFit" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomProperties">
    <xsd:sequence>
      <xsd:element name="customPr" type="CT_CustomProperty" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomProperty">
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute ref="r:id" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_OleObjects">
    <xsd:sequence>
      <xsd:element name="oleObject" type="CT_OleObject" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_OleObject">
    <xsd:sequence>
      <xsd:element name="objectPr" type="CT_ObjectPr" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="progId" type="xsd:string" use="optional"/>
    <xsd:attribute name="dvAspect" type="ST_DvAspect" use="optional" default="DVASPECT_CONTENT"/>
    <xsd:attribute name="link" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="oleUpdate" type="ST_OleUpdate" use="optional"/>
    <xsd:attribute name="autoLoad" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="shapeId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute ref="r:id" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ObjectPr">
    <xsd:sequence>
      <xsd:element name="anchor" type="CT_ObjectAnchor" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="locked" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="defaultSize" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="print" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="disabled" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="uiObject" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="autoFill" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="autoLine" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="autoPict" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="macro" type="ST_Formula" use="optional"/>
    <xsd:attribute name="altText" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="dde" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute ref="r:id" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DvAspect">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="DVASPECT_CONTENT"/>
      <xsd:enumeration value="DVASPECT_ICON"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_OleUpdate">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="OLEUPDATE_ALWAYS"/>
      <xsd:enumeration value="OLEUPDATE_ONCALL"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_WebPublishItems">
    <xsd:sequence>
      <xsd:element name="webPublishItem" type="CT_WebPublishItem" minOccurs="1"
        maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_WebPublishItem">
    <xsd:attribute name="id" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="divId" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="sourceType" type="ST_WebSourceType" use="required"/>
    <xsd:attribute name="sourceRef" type="ST_Ref" use="optional"/>
    <xsd:attribute name="sourceObject" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="destinationFile" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="title" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="autoRepublish" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Controls">
    <xsd:sequence>
      <xsd:element name="control" type="CT_Control" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Control">
    <xsd:sequence>
      <xsd:element name="controlPr" type="CT_ControlPr" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="shapeId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute ref="r:id" use="required"/>
    <xsd:attribute name="name" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ControlPr">
    <xsd:sequence>
      <xsd:element name="anchor" type="CT_ObjectAnchor" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="locked" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="defaultSize" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="print" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="disabled" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="recalcAlways" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="uiObject" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="autoFill" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="autoLine" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="autoPict" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="macro" type="ST_Formula" use="optional"/>
    <xsd:attribute name="altText" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="linkedCell" type="ST_Formula" use="optional"/>
    <xsd:attribute name="listFillRange" type="ST_Formula" use="optional"/>
    <xsd:attribute name="cf" type="s:ST_Xstring" use="optional" default="pict"/>
    <xsd:attribute ref="r:id" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_WebSourceType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="sheet"/>
      <xsd:enumeration value="printArea"/>
      <xsd:enumeration value="autoFilter"/>
      <xsd:enumeration value="range"/>
      <xsd:enumeration value="chart"/>
      <xsd:enumeration value="pivotTable"/>
      <xsd:enumeration value="query"/>
      <xsd:enumeration value="label"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_IgnoredErrors">
    <xsd:sequence>
      <xsd:element name="ignoredError" type="CT_IgnoredError" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_IgnoredError">
    <xsd:attribute name="sqref" type="ST_Sqref" use="required"/>
    <xsd:attribute name="evalError" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="twoDigitTextYear" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="numberStoredAsText" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="formula" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="formulaRange" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="unlockedFormula" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="emptyCellReference" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="listDataValidation" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="calculatedColumn" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PaneState">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="split"/>
      <xsd:enumeration value="frozen"/>
      <xsd:enumeration value="frozenSplit"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TableParts">
    <xsd:sequence>
      <xsd:element name="tablePart" type="CT_TablePart" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TablePart">
    <xsd:attribute ref="r:id" use="required"/>
  </xsd:complexType>
  <xsd:element name="metadata" type="CT_Metadata"/>
  <xsd:complexType name="CT_Metadata">
    <xsd:sequence>
      <xsd:element name="metadataTypes" type="CT_MetadataTypes" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="metadataStrings" type="CT_MetadataStrings" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="mdxMetadata" type="CT_MdxMetadata" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="futureMetadata" type="CT_FutureMetadata" minOccurs="0"
        maxOccurs="unbounded"/>
      <xsd:element name="cellMetadata" type="CT_MetadataBlocks" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="valueMetadata" type="CT_MetadataBlocks" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" minOccurs="0" maxOccurs="1" type="CT_ExtensionList"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_MetadataTypes">
    <xsd:sequence>
      <xsd:element name="metadataType" type="CT_MetadataType" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MetadataType">
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="minSupportedVersion" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="ghostRow" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="ghostCol" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="edit" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="delete" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="copy" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="pasteAll" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="pasteFormulas" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="pasteValues" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="pasteFormats" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="pasteComments" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="pasteDataValidation" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="pasteBorders" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="pasteColWidths" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="pasteNumberFormats" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="merge" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="splitFirst" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="splitAll" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="rowColShift" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="clearAll" type="xsd:boolean" default="false"/>
    <xsd:attribute name="clearFormats" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="clearContents" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="clearComments" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="assign" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="coerce" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="adjust" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="cellMeta" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MetadataBlocks">
    <xsd:sequence>
      <xsd:element name="bk" type="CT_MetadataBlock" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MetadataBlock">
    <xsd:sequence>
      <xsd:element name="rc" type="CT_MetadataRecord" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_MetadataRecord">
    <xsd:attribute name="t" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="v" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FutureMetadata">
    <xsd:sequence>
      <xsd:element name="bk" type="CT_FutureMetadataBlock" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="extLst" minOccurs="0" maxOccurs="1" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FutureMetadataBlock">
    <xsd:sequence>
      <xsd:element name="extLst" minOccurs="0" maxOccurs="1" type="CT_ExtensionList"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_MdxMetadata">
    <xsd:sequence>
      <xsd:element name="mdx" type="CT_Mdx" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Mdx">
    <xsd:choice minOccurs="1" maxOccurs="1">
      <xsd:element name="t" type="CT_MdxTuple"/>
      <xsd:element name="ms" type="CT_MdxSet"/>
      <xsd:element name="p" type="CT_MdxMemeberProp"/>
      <xsd:element name="k" type="CT_MdxKPI"/>
    </xsd:choice>
    <xsd:attribute name="n" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="f" type="ST_MdxFunctionType" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_MdxFunctionType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="m"/>
      <xsd:enumeration value="v"/>
      <xsd:enumeration value="s"/>
      <xsd:enumeration value="c"/>
      <xsd:enumeration value="r"/>
      <xsd:enumeration value="p"/>
      <xsd:enumeration value="k"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_MdxTuple">
    <xsd:sequence>
      <xsd:element name="n" type="CT_MetadataStringIndex" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="c" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="ct" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="si" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="fi" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="bc" type="ST_UnsignedIntHex" use="optional"/>
    <xsd:attribute name="fc" type="ST_UnsignedIntHex" use="optional"/>
    <xsd:attribute name="i" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="u" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="st" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="b" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MdxSet">
    <xsd:sequence>
      <xsd:element name="n" type="CT_MetadataStringIndex" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="ns" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="c" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="o" type="ST_MdxSetOrder" use="optional" default="u"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_MdxSetOrder">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="u"/>
      <xsd:enumeration value="a"/>
      <xsd:enumeration value="d"/>
      <xsd:enumeration value="aa"/>
      <xsd:enumeration value="ad"/>
      <xsd:enumeration value="na"/>
      <xsd:enumeration value="nd"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_MdxMemeberProp">
    <xsd:attribute name="n" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="np" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MdxKPI">
    <xsd:attribute name="n" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="np" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="p" type="ST_MdxKPIProperty" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_MdxKPIProperty">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="v"/>
      <xsd:enumeration value="g"/>
      <xsd:enumeration value="s"/>
      <xsd:enumeration value="t"/>
      <xsd:enumeration value="w"/>
      <xsd:enumeration value="m"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_MetadataStringIndex">
    <xsd:attribute name="x" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="s" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_MetadataStrings">
    <xsd:sequence>
      <xsd:element name="s" type="CT_XStringElement" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:element name="singleXmlCells" type="CT_SingleXmlCells"/>
  <xsd:complexType name="CT_SingleXmlCells">
    <xsd:sequence>
      <xsd:element name="singleXmlCell" type="CT_SingleXmlCell" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_SingleXmlCell">
    <xsd:sequence>
      <xsd:element name="xmlCellPr" type="CT_XmlCellPr" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="id" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="r" type="ST_CellRef" use="required"/>
    <xsd:attribute name="connectionId" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_XmlCellPr">
    <xsd:sequence>
      <xsd:element name="xmlPr" type="CT_XmlPr" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="id" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="uniqueName" type="s:ST_Xstring" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_XmlPr">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="mapId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="xpath" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="xmlDataType" type="ST_XmlDataType" use="required"/>
  </xsd:complexType>
  <xsd:element name="styleSheet" type="CT_Stylesheet"/>
  <xsd:complexType name="CT_Stylesheet">
    <xsd:sequence>
      <xsd:element name="numFmts" type="CT_NumFmts" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="fonts" type="CT_Fonts" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="fills" type="CT_Fills" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="borders" type="CT_Borders" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="cellStyleXfs" type="CT_CellStyleXfs" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="cellXfs" type="CT_CellXfs" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="cellStyles" type="CT_CellStyles" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="dxfs" type="CT_Dxfs" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tableStyles" type="CT_TableStyles" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="colors" type="CT_Colors" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_CellAlignment">
    <xsd:attribute name="horizontal" type="ST_HorizontalAlignment" use="optional"/>
    <xsd:attribute name="vertical" type="ST_VerticalAlignment" default="bottom" use="optional"/>
    <xsd:attribute name="textRotation" type="ST_TextRotation" use="optional"/>
    <xsd:attribute name="wrapText" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="indent" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="relativeIndent" type="xsd:int" use="optional"/>
    <xsd:attribute name="justifyLastLine" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="shrinkToFit" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="readingOrder" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextRotation">
    <xsd:union>
      <xsd:simpleType>
        <xsd:restriction base="xsd:nonNegativeInteger">
          <xsd:maxInclusive value="180"/>
        </xsd:restriction>
      </xsd:simpleType>
      <xsd:simpleType>
        <xsd:restriction base="xsd:nonNegativeInteger">
          <xsd:enumeration value="255"/>
        </xsd:restriction>
      </xsd:simpleType>
    </xsd:union>
  </xsd:simpleType>
  <xsd:simpleType name="ST_BorderStyle">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="thin"/>
      <xsd:enumeration value="medium"/>
      <xsd:enumeration value="dashed"/>
      <xsd:enumeration value="dotted"/>
      <xsd:enumeration value="thick"/>
      <xsd:enumeration value="double"/>
      <xsd:enumeration value="hair"/>
      <xsd:enumeration value="mediumDashed"/>
      <xsd:enumeration value="dashDot"/>
      <xsd:enumeration value="mediumDashDot"/>
      <xsd:enumeration value="dashDotDot"/>
      <xsd:enumeration value="mediumDashDotDot"/>
      <xsd:enumeration value="slantDashDot"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Borders">
    <xsd:sequence>
      <xsd:element name="border" type="CT_Border" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Border">
    <xsd:sequence>
      <xsd:element name="start" type="CT_BorderPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="end" type="CT_BorderPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="left" type="CT_BorderPr" minOccurs="0"/>
      <xsd:element name="right" type="CT_BorderPr" minOccurs="0"/>
      <xsd:element name="top" type="CT_BorderPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="bottom" type="CT_BorderPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="diagonal" type="CT_BorderPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="vertical" type="CT_BorderPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="horizontal" type="CT_BorderPr" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="diagonalUp" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="diagonalDown" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="outline" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_BorderPr">
    <xsd:sequence>
      <xsd:element name="color" type="CT_Color" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="style" type="ST_BorderStyle" use="optional" default="none"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CellProtection">
    <xsd:attribute name="locked" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="hidden" type="xsd:boolean" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Fonts">
    <xsd:sequence>
      <xsd:element name="font" type="CT_Font" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Fills">
    <xsd:sequence>
      <xsd:element name="fill" type="CT_Fill" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Fill">
    <xsd:choice minOccurs="1" maxOccurs="1">
      <xsd:element name="patternFill" type="CT_PatternFill" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="gradientFill" type="CT_GradientFill" minOccurs="0" maxOccurs="1"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:complexType name="CT_PatternFill">
    <xsd:sequence>
      <xsd:element name="fgColor" type="CT_Color" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="bgColor" type="CT_Color" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="patternType" type="ST_PatternType" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Color">
    <xsd:attribute name="auto" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="indexed" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="rgb" type="ST_UnsignedIntHex" use="optional"/>
    <xsd:attribute name="theme" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="tint" type="xsd:double" use="optional" default="0.0"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PatternType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="solid"/>
      <xsd:enumeration value="mediumGray"/>
      <xsd:enumeration value="darkGray"/>
      <xsd:enumeration value="lightGray"/>
      <xsd:enumeration value="darkHorizontal"/>
      <xsd:enumeration value="darkVertical"/>
      <xsd:enumeration value="darkDown"/>
      <xsd:enumeration value="darkUp"/>
      <xsd:enumeration value="darkGrid"/>
      <xsd:enumeration value="darkTrellis"/>
      <xsd:enumeration value="lightHorizontal"/>
      <xsd:enumeration value="lightVertical"/>
      <xsd:enumeration value="lightDown"/>
      <xsd:enumeration value="lightUp"/>
      <xsd:enumeration value="lightGrid"/>
      <xsd:enumeration value="lightTrellis"/>
      <xsd:enumeration value="gray125"/>
      <xsd:enumeration value="gray0625"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_GradientFill">
    <xsd:sequence>
      <xsd:element name="stop" type="CT_GradientStop" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="type" type="ST_GradientType" use="optional" default="linear"/>
    <xsd:attribute name="degree" type="xsd:double" use="optional" default="0"/>
    <xsd:attribute name="left" type="xsd:double" use="optional" default="0"/>
    <xsd:attribute name="right" type="xsd:double" use="optional" default="0"/>
    <xsd:attribute name="top" type="xsd:double" use="optional" default="0"/>
    <xsd:attribute name="bottom" type="xsd:double" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GradientStop">
    <xsd:sequence>
      <xsd:element name="color" type="CT_Color" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="position" type="xsd:double" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_GradientType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="linear"/>
      <xsd:enumeration value="path"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_HorizontalAlignment">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="general"/>
      <xsd:enumeration value="left"/>
      <xsd:enumeration value="center"/>
      <xsd:enumeration value="right"/>
      <xsd:enumeration value="fill"/>
      <xsd:enumeration value="justify"/>
      <xsd:enumeration value="centerContinuous"/>
      <xsd:enumeration value="distributed"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_VerticalAlignment">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="top"/>
      <xsd:enumeration value="center"/>
      <xsd:enumeration value="bottom"/>
      <xsd:enumeration value="justify"/>
      <xsd:enumeration value="distributed"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_NumFmts">
    <xsd:sequence>
      <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_NumFmt">
    <xsd:attribute name="numFmtId" type="ST_NumFmtId" use="required"/>
    <xsd:attribute name="formatCode" type="s:ST_Xstring" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CellStyleXfs">
    <xsd:sequence>
      <xsd:element name="xf" type="CT_Xf" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CellXfs">
    <xsd:sequence>
      <xsd:element name="xf" type="CT_Xf" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Xf">
    <xsd:sequence>
      <xsd:element name="alignment" type="CT_CellAlignment" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="protection" type="CT_CellProtection" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="numFmtId" type="ST_NumFmtId" use="optional"/>
    <xsd:attribute name="fontId" type="ST_FontId" use="optional"/>
    <xsd:attribute name="fillId" type="ST_FillId" use="optional"/>
    <xsd:attribute name="borderId" type="ST_BorderId" use="optional"/>
    <xsd:attribute name="xfId" type="ST_CellStyleXfId" use="optional"/>
    <xsd:attribute name="quotePrefix" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="pivotButton" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="applyNumberFormat" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="applyFont" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="applyFill" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="applyBorder" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="applyAlignment" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="applyProtection" type="xsd:boolean" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CellStyles">
    <xsd:sequence>
      <xsd:element name="cellStyle" type="CT_CellStyle" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CellStyle">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="xfId" type="ST_CellStyleXfId" use="required"/>
    <xsd:attribute name="builtinId" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="iLevel" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="hidden" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="customBuiltin" type="xsd:boolean" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Dxfs">
    <xsd:sequence>
      <xsd:element name="dxf" type="CT_Dxf" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Dxf">
    <xsd:sequence>
      <xsd:element name="font" type="CT_Font" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="fill" type="CT_Fill" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="alignment" type="CT_CellAlignment" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="border" type="CT_Border" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="protection" type="CT_CellProtection" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_NumFmtId">
    <xsd:restriction base="xsd:unsignedInt"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FontId">
    <xsd:restriction base="xsd:unsignedInt"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FillId">
    <xsd:restriction base="xsd:unsignedInt"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_BorderId">
    <xsd:restriction base="xsd:unsignedInt"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_CellStyleXfId">
    <xsd:restriction base="xsd:unsignedInt"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_DxfId">
    <xsd:restriction base="xsd:unsignedInt"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_Colors">
    <xsd:sequence>
      <xsd:element name="indexedColors" type="CT_IndexedColors" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="mruColors" type="CT_MRUColors" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_IndexedColors">
    <xsd:sequence>
      <xsd:element name="rgbColor" type="CT_RgbColor" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_MRUColors">
    <xsd:sequence>
      <xsd:element name="color" type="CT_Color" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_RgbColor">
    <xsd:attribute name="rgb" type="ST_UnsignedIntHex" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TableStyles">
    <xsd:sequence>
      <xsd:element name="tableStyle" type="CT_TableStyle" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="defaultTableStyle" type="xsd:string" use="optional"/>
    <xsd:attribute name="defaultPivotStyle" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TableStyle">
    <xsd:sequence>
      <xsd:element name="tableStyleElement" type="CT_TableStyleElement" minOccurs="0"
        maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="xsd:string" use="required"/>
    <xsd:attribute name="pivot" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="table" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TableStyleElement">
    <xsd:attribute name="type" type="ST_TableStyleType" use="required"/>
    <xsd:attribute name="size" type="xsd:unsignedInt" use="optional" default="1"/>
    <xsd:attribute name="dxfId" type="ST_DxfId" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TableStyleType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="wholeTable"/>
      <xsd:enumeration value="headerRow"/>
      <xsd:enumeration value="totalRow"/>
      <xsd:enumeration value="firstColumn"/>
      <xsd:enumeration value="lastColumn"/>
      <xsd:enumeration value="firstRowStripe"/>
      <xsd:enumeration value="secondRowStripe"/>
      <xsd:enumeration value="firstColumnStripe"/>
      <xsd:enumeration value="secondColumnStripe"/>
      <xsd:enumeration value="firstHeaderCell"/>
      <xsd:enumeration value="lastHeaderCell"/>
      <xsd:enumeration value="firstTotalCell"/>
      <xsd:enumeration value="lastTotalCell"/>
      <xsd:enumeration value="firstSubtotalColumn"/>
      <xsd:enumeration value="secondSubtotalColumn"/>
      <xsd:enumeration value="thirdSubtotalColumn"/>
      <xsd:enumeration value="firstSubtotalRow"/>
      <xsd:enumeration value="secondSubtotalRow"/>
      <xsd:enumeration value="thirdSubtotalRow"/>
      <xsd:enumeration value="blankRow"/>
      <xsd:enumeration value="firstColumnSubheading"/>
      <xsd:enumeration value="secondColumnSubheading"/>
      <xsd:enumeration value="thirdColumnSubheading"/>
      <xsd:enumeration value="firstRowSubheading"/>
      <xsd:enumeration value="secondRowSubheading"/>
      <xsd:enumeration value="thirdRowSubheading"/>
      <xsd:enumeration value="pageFieldLabels"/>
      <xsd:enumeration value="pageFieldValues"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_BooleanProperty">
    <xsd:attribute name="val" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FontSize">
    <xsd:attribute name="val" type="xsd:double" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_IntProperty">
    <xsd:attribute name="val" type="xsd:int" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FontName">
    <xsd:attribute name="val" type="s:ST_Xstring" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_VerticalAlignFontProperty">
    <xsd:attribute name="val" type="s:ST_VerticalAlignRun" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FontScheme">
    <xsd:attribute name="val" type="ST_FontScheme" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_FontScheme">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="major"/>
      <xsd:enumeration value="minor"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_UnderlineProperty">
    <xsd:attribute name="val" type="ST_UnderlineValues" use="optional" default="single"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_UnderlineValues">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="single"/>
      <xsd:enumeration value="double"/>
      <xsd:enumeration value="singleAccounting"/>
      <xsd:enumeration value="doubleAccounting"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Font">
    <xsd:choice maxOccurs="unbounded">
      <xsd:element name="name" type="CT_FontName" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="charset" type="CT_IntProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="family" type="CT_FontFamily" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="b" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="i" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="strike" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="outline" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="shadow" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="condense" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extend" type="CT_BooleanProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="color" type="CT_Color" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sz" type="CT_FontSize" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="u" type="CT_UnderlineProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="vertAlign" type="CT_VerticalAlignFontProperty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="scheme" type="CT_FontScheme" minOccurs="0" maxOccurs="1"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:complexType name="CT_FontFamily">
    <xsd:attribute name="val" type="ST_FontFamily" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_FontFamily">
    <xsd:restriction base="xsd:integer">
      <xsd:minInclusive value="0"/>
      <xsd:maxInclusive value="14"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:attributeGroup name="AG_AutoFormat">
    <xsd:attribute name="autoFormatId" type="xsd:unsignedInt"/>
    <xsd:attribute name="applyNumberFormats" type="xsd:boolean"/>
    <xsd:attribute name="applyBorderFormats" type="xsd:boolean"/>
    <xsd:attribute name="applyFontFormats" type="xsd:boolean"/>
    <xsd:attribute name="applyPatternFormats" type="xsd:boolean"/>
    <xsd:attribute name="applyAlignmentFormats" type="xsd:boolean"/>
    <xsd:attribute name="applyWidthHeightFormats" type="xsd:boolean"/>
  </xsd:attributeGroup>
  <xsd:element name="externalLink" type="CT_ExternalLink"/>
  <xsd:complexType name="CT_ExternalLink">
    <xsd:sequence>
      <xsd:choice>
        <xsd:element name="externalBook" type="CT_ExternalBook" minOccurs="0" maxOccurs="1"/>
        <xsd:element name="ddeLink" type="CT_DdeLink" minOccurs="0" maxOccurs="1"/>
        <xsd:element name="oleLink" type="CT_OleLink" minOccurs="0" maxOccurs="1"/>
      </xsd:choice>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ExternalBook">
    <xsd:sequence>
      <xsd:element name="sheetNames" type="CT_ExternalSheetNames" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="definedNames" type="CT_ExternalDefinedNames" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sheetDataSet" type="CT_ExternalSheetDataSet" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute ref="r:id" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ExternalSheetNames">
    <xsd:sequence>
      <xsd:element name="sheetName" minOccurs="1" maxOccurs="unbounded" type="CT_ExternalSheetName"
      />
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ExternalSheetName">
    <xsd:attribute name="val" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ExternalDefinedNames">
    <xsd:sequence>
      <xsd:element name="definedName" type="CT_ExternalDefinedName" minOccurs="0"
        maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ExternalDefinedName">
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="refersTo" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="sheetId" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ExternalSheetDataSet">
    <xsd:sequence>
      <xsd:element name="sheetData" type="CT_ExternalSheetData" minOccurs="1" maxOccurs="unbounded"
      />
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ExternalSheetData">
    <xsd:sequence>
      <xsd:element name="row" type="CT_ExternalRow" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="sheetId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="refreshError" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ExternalRow">
    <xsd:sequence>
      <xsd:element name="cell" type="CT_ExternalCell" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="r" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ExternalCell">
    <xsd:sequence>
      <xsd:element name="v" type="s:ST_Xstring" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="r" type="ST_CellRef" use="optional"/>
    <xsd:attribute name="t" type="ST_CellType" use="optional" default="n"/>
    <xsd:attribute name="vm" type="xsd:unsignedInt" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DdeLink">
    <xsd:sequence>
      <xsd:element name="ddeItems" type="CT_DdeItems" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="ddeService" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="ddeTopic" type="s:ST_Xstring" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DdeItems">
    <xsd:sequence>
      <xsd:element name="ddeItem" type="CT_DdeItem" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_DdeItem">
    <xsd:sequence>
      <xsd:element name="values" type="CT_DdeValues" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="s:ST_Xstring" default="0"/>
    <xsd:attribute name="ole" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="advise" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="preferPic" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DdeValues">
    <xsd:sequence>
      <xsd:element name="value" minOccurs="1" maxOccurs="unbounded" type="CT_DdeValue"/>
    </xsd:sequence>
    <xsd:attribute name="rows" type="xsd:unsignedInt" use="optional" default="1"/>
    <xsd:attribute name="cols" type="xsd:unsignedInt" use="optional" default="1"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DdeValue">
    <xsd:sequence>
      <xsd:element name="val" type="s:ST_Xstring" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="t" type="ST_DdeValueType" use="optional" default="n"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DdeValueType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="nil"/>
      <xsd:enumeration value="b"/>
      <xsd:enumeration value="n"/>
      <xsd:enumeration value="e"/>
      <xsd:enumeration value="str"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_OleLink">
    <xsd:sequence>
      <xsd:element name="oleItems" type="CT_OleItems" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute ref="r:id" use="required"/>
    <xsd:attribute name="progId" type="s:ST_Xstring" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_OleItems">
    <xsd:sequence>
      <xsd:element name="oleItem" type="CT_OleItem" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_OleItem">
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="icon" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="advise" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="preferPic" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:element name="table" type="CT_Table"/>
  <xsd:complexType name="CT_Table">
    <xsd:sequence>
      <xsd:element name="autoFilter" type="CT_AutoFilter" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sortState" type="CT_SortState" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tableColumns" type="CT_TableColumns" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="tableStyleInfo" type="CT_TableStyleInfo" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="id" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="name" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="displayName" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="comment" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="ref" type="ST_Ref" use="required"/>
    <xsd:attribute name="tableType" type="ST_TableType" use="optional" default="worksheet"/>
    <xsd:attribute name="headerRowCount" type="xsd:unsignedInt" use="optional" default="1"/>
    <xsd:attribute name="insertRow" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="insertRowShift" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="totalsRowCount" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="totalsRowShown" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="published" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="headerRowDxfId" type="ST_DxfId" use="optional"/>
    <xsd:attribute name="dataDxfId" type="ST_DxfId" use="optional"/>
    <xsd:attribute name="totalsRowDxfId" type="ST_DxfId" use="optional"/>
    <xsd:attribute name="headerRowBorderDxfId" type="ST_DxfId" use="optional"/>
    <xsd:attribute name="tableBorderDxfId" type="ST_DxfId" use="optional"/>
    <xsd:attribute name="totalsRowBorderDxfId" type="ST_DxfId" use="optional"/>
    <xsd:attribute name="headerRowCellStyle" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="dataCellStyle" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="totalsRowCellStyle" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="connectionId" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TableType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="worksheet"/>
      <xsd:enumeration value="xml"/>
      <xsd:enumeration value="queryTable"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TableStyleInfo">
    <xsd:attribute name="name" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="showFirstColumn" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="showLastColumn" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="showRowStripes" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="showColumnStripes" type="xsd:boolean" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TableColumns">
    <xsd:sequence>
      <xsd:element name="tableColumn" type="CT_TableColumn" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TableColumn">
    <xsd:sequence>
      <xsd:element name="calculatedColumnFormula" type="CT_TableFormula" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="totalsRowFormula" type="CT_TableFormula" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="xmlColumnPr" type="CT_XmlColumnPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="id" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="uniqueName" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="totalsRowFunction" type="ST_TotalsRowFunction" use="optional"
      default="none"/>
    <xsd:attribute name="totalsRowLabel" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="queryTableFieldId" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="headerRowDxfId" type="ST_DxfId" use="optional"/>
    <xsd:attribute name="dataDxfId" type="ST_DxfId" use="optional"/>
    <xsd:attribute name="totalsRowDxfId" type="ST_DxfId" use="optional"/>
    <xsd:attribute name="headerRowCellStyle" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="dataCellStyle" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="totalsRowCellStyle" type="s:ST_Xstring" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TableFormula">
    <xsd:simpleContent>
      <xsd:extension base="ST_Formula">
        <xsd:attribute name="array" type="xsd:boolean" default="false"/>
      </xsd:extension>
    </xsd:simpleContent>
  </xsd:complexType>
  <xsd:simpleType name="ST_TotalsRowFunction">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="sum"/>
      <xsd:enumeration value="min"/>
      <xsd:enumeration value="max"/>
      <xsd:enumeration value="average"/>
      <xsd:enumeration value="count"/>
      <xsd:enumeration value="countNums"/>
      <xsd:enumeration value="stdDev"/>
      <xsd:enumeration value="var"/>
      <xsd:enumeration value="custom"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_XmlColumnPr">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="mapId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="xpath" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="denormalized" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="xmlDataType" type="ST_XmlDataType" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_XmlDataType">
    <xsd:restriction base="xsd:string"/>
  </xsd:simpleType>
  <xsd:element name="volTypes" type="CT_VolTypes"/>
  <xsd:complexType name="CT_VolTypes">
    <xsd:sequence>
      <xsd:element name="volType" type="CT_VolType" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_VolType">
    <xsd:sequence>
      <xsd:element name="main" type="CT_VolMain" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="type" type="ST_VolDepType" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_VolMain">
    <xsd:sequence>
      <xsd:element name="tp" type="CT_VolTopic" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="first" type="s:ST_Xstring" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_VolTopic">
    <xsd:sequence>
      <xsd:element name="v" type="s:ST_Xstring" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="stp" type="s:ST_Xstring" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="tr" type="CT_VolTopicRef" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="t" type="ST_VolValueType" use="optional" default="n"/>
  </xsd:complexType>
  <xsd:complexType name="CT_VolTopicRef">
    <xsd:attribute name="r" type="ST_CellRef" use="required"/>
    <xsd:attribute name="s" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_VolDepType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="realTimeData"/>
      <xsd:enumeration value="olapFunctions"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_VolValueType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="b"/>
      <xsd:enumeration value="n"/>
      <xsd:enumeration value="e"/>
      <xsd:enumeration value="s"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:element name="workbook" type="CT_Workbook"/>
  <xsd:complexType name="CT_Workbook">
    <xsd:sequence>
      <xsd:element name="fileVersion" type="CT_FileVersion" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="fileSharing" type="CT_FileSharing" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="workbookPr" type="CT_WorkbookPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="workbookProtection" type="CT_WorkbookProtection" minOccurs="0"
        maxOccurs="1"/>
      <xsd:element name="bookViews" type="CT_BookViews" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sheets" type="CT_Sheets" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="functionGroups" type="CT_FunctionGroups" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="externalReferences" type="CT_ExternalReferences" minOccurs="0"
        maxOccurs="1"/>
      <xsd:element name="definedNames" type="CT_DefinedNames" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="calcPr" type="CT_CalcPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="oleSize" type="CT_OleSize" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="customWorkbookViews" type="CT_CustomWorkbookViews" minOccurs="0"
        maxOccurs="1"/>
      <xsd:element name="pivotCaches" type="CT_PivotCaches" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="smartTagPr" type="CT_SmartTagPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="smartTagTypes" type="CT_SmartTagTypes" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="webPublishing" type="CT_WebPublishing" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="fileRecoveryPr" type="CT_FileRecoveryPr" minOccurs="0"
        maxOccurs="unbounded"/>
      <xsd:element name="webPublishObjects" type="CT_WebPublishObjects" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="conformance" type="s:ST_ConformanceClass"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FileVersion">
    <xsd:attribute name="appName" type="xsd:string" use="optional"/>
    <xsd:attribute name="lastEdited" type="xsd:string" use="optional"/>
    <xsd:attribute name="lowestEdited" type="xsd:string" use="optional"/>
    <xsd:attribute name="rupBuild" type="xsd:string" use="optional"/>
    <xsd:attribute name="codeName" type="s:ST_Guid" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_BookViews">
    <xsd:sequence>
      <xsd:element name="workbookView" type="CT_BookView" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_BookView">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="visibility" type="ST_Visibility" use="optional" default="visible"/>
    <xsd:attribute name="minimized" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showHorizontalScroll" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="showVerticalScroll" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="showSheetTabs" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="xWindow" type="xsd:int" use="optional"/>
    <xsd:attribute name="yWindow" type="xsd:int" use="optional"/>
    <xsd:attribute name="windowWidth" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="windowHeight" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="tabRatio" type="xsd:unsignedInt" use="optional" default="600"/>
    <xsd:attribute name="firstSheet" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="activeTab" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="autoFilterDateGrouping" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Visibility">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="visible"/>
      <xsd:enumeration value="hidden"/>
      <xsd:enumeration value="veryHidden"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_CustomWorkbookViews">
    <xsd:sequence>
      <xsd:element name="customWorkbookView" minOccurs="1" maxOccurs="unbounded"
        type="CT_CustomWorkbookView"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomWorkbookView">
    <xsd:sequence>
      <xsd:element name="extLst" minOccurs="0" type="CT_ExtensionList"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="guid" type="s:ST_Guid" use="required"/>
    <xsd:attribute name="autoUpdate" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="mergeInterval" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="changesSavedWin" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="onlySync" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="personalView" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="includePrintSettings" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="includeHiddenRowCol" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="maximized" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="minimized" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showHorizontalScroll" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="showVerticalScroll" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="showSheetTabs" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="xWindow" type="xsd:int" use="optional" default="0"/>
    <xsd:attribute name="yWindow" type="xsd:int" use="optional" default="0"/>
    <xsd:attribute name="windowWidth" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="windowHeight" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="tabRatio" type="xsd:unsignedInt" use="optional" default="600"/>
    <xsd:attribute name="activeSheetId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="showFormulaBar" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="showStatusbar" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="showComments" type="ST_Comments" use="optional" default="commIndicator"/>
    <xsd:attribute name="showObjects" type="ST_Objects" use="optional" default="all"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Comments">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="commNone"/>
      <xsd:enumeration value="commIndicator"/>
      <xsd:enumeration value="commIndAndComment"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Objects">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="all"/>
      <xsd:enumeration value="placeholders"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Sheets">
    <xsd:sequence>
      <xsd:element name="sheet" type="CT_Sheet" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Sheet">
    <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="sheetId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="state" type="ST_SheetState" use="optional" default="visible"/>
    <xsd:attribute ref="r:id" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_SheetState">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="visible"/>
      <xsd:enumeration value="hidden"/>
      <xsd:enumeration value="veryHidden"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_WorkbookPr">
    <xsd:attribute name="date1904" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showObjects" type="ST_Objects" use="optional" default="all"/>
    <xsd:attribute name="showBorderUnselectedTables" type="xsd:boolean" use="optional"
      default="true"/>
    <xsd:attribute name="filterPrivacy" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="promptedSolutions" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showInkAnnotation" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="backupFile" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="saveExternalLinkValues" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="updateLinks" type="ST_UpdateLinks" use="optional" default="userSet"/>
    <xsd:attribute name="codeName" type="xsd:string" use="optional"/>
    <xsd:attribute name="hidePivotFieldList" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="showPivotChartFilter" type="xsd:boolean" default="false"/>
    <xsd:attribute name="allowRefreshQuery" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="publishItems" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="checkCompatibility" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="autoCompressPictures" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="refreshAllConnections" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="defaultThemeVersion" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_UpdateLinks">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="userSet"/>
      <xsd:enumeration value="never"/>
      <xsd:enumeration value="always"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_SmartTagPr">
    <xsd:attribute name="embed" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="show" type="ST_SmartTagShow" use="optional" default="all"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_SmartTagShow">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="all"/>
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="noIndicator"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_SmartTagTypes">
    <xsd:sequence>
      <xsd:element name="smartTagType" type="CT_SmartTagType" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_SmartTagType">
    <xsd:attribute name="namespaceUri" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="name" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="url" type="s:ST_Xstring" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FileRecoveryPr">
    <xsd:attribute name="autoRecover" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="crashSave" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="dataExtractLoad" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="repairLoad" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CalcPr">
    <xsd:attribute name="calcId" type="xsd:unsignedInt"/>
    <xsd:attribute name="calcMode" type="ST_CalcMode" use="optional" default="auto"/>
    <xsd:attribute name="fullCalcOnLoad" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="refMode" type="ST_RefMode" use="optional" default="A1"/>
    <xsd:attribute name="iterate" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="iterateCount" type="xsd:unsignedInt" use="optional" default="100"/>
    <xsd:attribute name="iterateDelta" type="xsd:double" use="optional" default="0.001"/>
    <xsd:attribute name="fullPrecision" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="calcCompleted" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="calcOnSave" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="concurrentCalc" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="concurrentManualCount" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="forceFullCalc" type="xsd:boolean" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_CalcMode">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="manual"/>
      <xsd:enumeration value="auto"/>
      <xsd:enumeration value="autoNoTable"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_RefMode">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="A1"/>
      <xsd:enumeration value="R1C1"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_DefinedNames">
    <xsd:sequence>
      <xsd:element name="definedName" type="CT_DefinedName" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_DefinedName">
    <xsd:simpleContent>
      <xsd:extension base="ST_Formula">
        <xsd:attribute name="name" type="s:ST_Xstring" use="required"/>
        <xsd:attribute name="comment" type="s:ST_Xstring" use="optional"/>
        <xsd:attribute name="customMenu" type="s:ST_Xstring" use="optional"/>
        <xsd:attribute name="description" type="s:ST_Xstring" use="optional"/>
        <xsd:attribute name="help" type="s:ST_Xstring" use="optional"/>
        <xsd:attribute name="statusBar" type="s:ST_Xstring" use="optional"/>
        <xsd:attribute name="localSheetId" type="xsd:unsignedInt" use="optional"/>
        <xsd:attribute name="hidden" type="xsd:boolean" use="optional" default="false"/>
        <xsd:attribute name="function" type="xsd:boolean" use="optional" default="false"/>
        <xsd:attribute name="vbProcedure" type="xsd:boolean" use="optional" default="false"/>
        <xsd:attribute name="xlm" type="xsd:boolean" use="optional" default="false"/>
        <xsd:attribute name="functionGroupId" type="xsd:unsignedInt" use="optional"/>
        <xsd:attribute name="shortcutKey" type="s:ST_Xstring" use="optional"/>
        <xsd:attribute name="publishToServer" type="xsd:boolean" use="optional" default="false"/>
        <xsd:attribute name="workbookParameter" type="xsd:boolean" use="optional" default="false"/>
      </xsd:extension>
    </xsd:simpleContent>
  </xsd:complexType>
  <xsd:complexType name="CT_ExternalReferences">
    <xsd:sequence>
      <xsd:element name="externalReference" type="CT_ExternalReference" minOccurs="1"
        maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ExternalReference">
    <xsd:attribute ref="r:id" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SheetBackgroundPicture">
    <xsd:attribute ref="r:id" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotCaches">
    <xsd:sequence>
      <xsd:element name="pivotCache" type="CT_PivotCache" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_PivotCache">
    <xsd:attribute name="cacheId" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute ref="r:id" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FileSharing">
    <xsd:attribute name="readOnlyRecommended" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="userName" type="s:ST_Xstring"/>
    <xsd:attribute name="reservationPassword" type="ST_UnsignedShortHex"/>
    <xsd:attribute name="algorithmName" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="hashValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="saltValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="spinCount" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_OleSize">
    <xsd:attribute name="ref" type="ST_Ref" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_WorkbookProtection">
    <xsd:attribute name="workbookPassword" type="ST_UnsignedShortHex" use="optional"/>
    <xsd:attribute name="workbookPasswordCharacterSet" type="xsd:string" use="optional"/>
    <xsd:attribute name="revisionsPassword" type="ST_UnsignedShortHex" use="optional"/>
    <xsd:attribute name="revisionsPasswordCharacterSet" type="xsd:string" use="optional"/>
    <xsd:attribute name="lockStructure" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="lockWindows" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="lockRevision" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="revisionsAlgorithmName" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="revisionsHashValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="revisionsSaltValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="revisionsSpinCount" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="workbookAlgorithmName" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="workbookHashValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="workbookSaltValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="workbookSpinCount" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_WebPublishing">
    <xsd:attribute name="css" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="thicket" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="longFileNames" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="vml" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="allowPng" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="targetScreenSize" type="ST_TargetScreenSize" use="optional"
      default="800x600"/>
    <xsd:attribute name="dpi" type="xsd:unsignedInt" use="optional" default="96"/>
    <xsd:attribute name="codePage" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="characterSet" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TargetScreenSize">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="544x376"/>
      <xsd:enumeration value="640x480"/>
      <xsd:enumeration value="720x512"/>
      <xsd:enumeration value="800x600"/>
      <xsd:enumeration value="1024x768"/>
      <xsd:enumeration value="1152x882"/>
      <xsd:enumeration value="1152x900"/>
      <xsd:enumeration value="1280x1024"/>
      <xsd:enumeration value="1600x1200"/>
      <xsd:enumeration value="1800x1440"/>
      <xsd:enumeration value="1920x1200"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_FunctionGroups">
    <xsd:sequence maxOccurs="unbounded">
      <xsd:element name="functionGroup" type="CT_FunctionGroup" minOccurs="0"/>
    </xsd:sequence>
    <xsd:attribute name="builtInGroupCount" type="xsd:unsignedInt" default="16" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FunctionGroup">
    <xsd:attribute name="name" type="s:ST_Xstring"/>
  </xsd:complexType>
  <xsd:complexType name="CT_WebPublishObjects">
    <xsd:sequence>
      <xsd:element name="webPublishObject" type="CT_WebPublishObject" minOccurs="1"
        maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="count" type="xsd:unsignedInt" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_WebPublishObject">
    <xsd:attribute name="id" type="xsd:unsignedInt" use="required"/>
    <xsd:attribute name="divId" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="sourceObject" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="destinationFile" type="s:ST_Xstring" use="required"/>
    <xsd:attribute name="title" type="s:ST_Xstring" use="optional"/>
    <xsd:attribute name="autoRepublish" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
</xsd:schema>
