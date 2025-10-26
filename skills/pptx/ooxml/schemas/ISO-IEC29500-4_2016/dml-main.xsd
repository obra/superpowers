<?xml version="1.0" encoding="utf-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:s="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
  xmlns="http://schemas.openxmlformats.org/drawingml/2006/main"
  targetNamespace="http://schemas.openxmlformats.org/drawingml/2006/main"
  elementFormDefault="qualified">
  <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    schemaLocation="shared-relationshipReference.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
    schemaLocation="shared-commonSimpleTypes.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/drawingml/2006/diagram"
    schemaLocation="dml-diagram.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/drawingml/2006/chart"
    schemaLocation="dml-chart.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/drawingml/2006/picture"
    schemaLocation="dml-picture.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/drawingml/2006/lockedCanvas"
    schemaLocation="dml-lockedCanvas.xsd"/>
  <xsd:complexType name="CT_AudioFile">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute ref="r:link" use="required"/>
    <xsd:attribute name="contentType" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_VideoFile">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute ref="r:link" use="required"/>
    <xsd:attribute name="contentType" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_QuickTimeFile">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute ref="r:link" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AudioCDTime">
    <xsd:attribute name="track" type="xsd:unsignedByte" use="required"/>
    <xsd:attribute name="time" type="xsd:unsignedInt" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AudioCD">
    <xsd:sequence>
      <xsd:element name="st" type="CT_AudioCDTime" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="end" type="CT_AudioCDTime" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:group name="EG_Media">
    <xsd:choice>
      <xsd:element name="audioCd" type="CT_AudioCD"/>
      <xsd:element name="wavAudioFile" type="CT_EmbeddedWAVAudioFile"/>
      <xsd:element name="audioFile" type="CT_AudioFile"/>
      <xsd:element name="videoFile" type="CT_VideoFile"/>
      <xsd:element name="quickTimeFile" type="CT_QuickTimeFile"/>
    </xsd:choice>
  </xsd:group>
  <xsd:element name="videoFile" type="CT_VideoFile"/>
  <xsd:simpleType name="ST_StyleMatrixColumnIndex">
    <xsd:restriction base="xsd:unsignedInt"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FontCollectionIndex">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="major"/>
      <xsd:enumeration value="minor"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_ColorSchemeIndex">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="dk1"/>
      <xsd:enumeration value="lt1"/>
      <xsd:enumeration value="dk2"/>
      <xsd:enumeration value="lt2"/>
      <xsd:enumeration value="accent1"/>
      <xsd:enumeration value="accent2"/>
      <xsd:enumeration value="accent3"/>
      <xsd:enumeration value="accent4"/>
      <xsd:enumeration value="accent5"/>
      <xsd:enumeration value="accent6"/>
      <xsd:enumeration value="hlink"/>
      <xsd:enumeration value="folHlink"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_ColorScheme">
    <xsd:sequence>
      <xsd:element name="dk1" type="CT_Color" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="lt1" type="CT_Color" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="dk2" type="CT_Color" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="lt2" type="CT_Color" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="accent1" type="CT_Color" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="accent2" type="CT_Color" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="accent3" type="CT_Color" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="accent4" type="CT_Color" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="accent5" type="CT_Color" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="accent6" type="CT_Color" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="hlink" type="CT_Color" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="folHlink" type="CT_Color" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="xsd:string" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomColor">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="xsd:string" use="optional" default=""/>
  </xsd:complexType>
  <xsd:complexType name="CT_SupplementalFont">
    <xsd:attribute name="script" type="xsd:string" use="required"/>
    <xsd:attribute name="typeface" type="ST_TextTypeface" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomColorList">
    <xsd:sequence>
      <xsd:element name="custClr" type="CT_CustomColor" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_FontCollection">
    <xsd:sequence>
      <xsd:element name="latin" type="CT_TextFont" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="ea" type="CT_TextFont" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="cs" type="CT_TextFont" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="font" type="CT_SupplementalFont" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_EffectStyleItem">
    <xsd:sequence>
      <xsd:group ref="EG_EffectProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="scene3d" type="CT_Scene3D" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sp3d" type="CT_Shape3D" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_FontScheme">
    <xsd:sequence>
      <xsd:element name="majorFont" type="CT_FontCollection" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="minorFont" type="CT_FontCollection" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="xsd:string" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FillStyleList">
    <xsd:sequence>
      <xsd:group ref="EG_FillProperties" minOccurs="3" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_LineStyleList">
    <xsd:sequence>
      <xsd:element name="ln" type="CT_LineProperties" minOccurs="3" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_EffectStyleList">
    <xsd:sequence>
      <xsd:element name="effectStyle" type="CT_EffectStyleItem" minOccurs="3" maxOccurs="unbounded"
      />
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_BackgroundFillStyleList">
    <xsd:sequence>
      <xsd:group ref="EG_FillProperties" minOccurs="3" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_StyleMatrix">
    <xsd:sequence>
      <xsd:element name="fillStyleLst" type="CT_FillStyleList" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="lnStyleLst" type="CT_LineStyleList" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="effectStyleLst" type="CT_EffectStyleList" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="bgFillStyleLst" type="CT_BackgroundFillStyleList" minOccurs="1"
        maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="xsd:string" use="optional" default=""/>
  </xsd:complexType>
  <xsd:complexType name="CT_BaseStyles">
    <xsd:sequence>
      <xsd:element name="clrScheme" type="CT_ColorScheme" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="fontScheme" type="CT_FontScheme" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="fmtScheme" type="CT_StyleMatrix" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_OfficeArtExtension">
    <xsd:sequence>
      <xsd:any processContents="lax" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="uri" type="xsd:token" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Coordinate">
    <xsd:union memberTypes="ST_CoordinateUnqualified s:ST_UniversalMeasure"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_CoordinateUnqualified">
    <xsd:restriction base="xsd:long">
      <xsd:minInclusive value="-27273042329600"/>
      <xsd:maxInclusive value="27273042316900"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Coordinate32">
    <xsd:union memberTypes="ST_Coordinate32Unqualified s:ST_UniversalMeasure"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Coordinate32Unqualified">
    <xsd:restriction base="xsd:int"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PositiveCoordinate">
    <xsd:restriction base="xsd:long">
      <xsd:minInclusive value="0"/>
      <xsd:maxInclusive value="27273042316900"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PositiveCoordinate32">
    <xsd:restriction base="ST_Coordinate32Unqualified">
      <xsd:minInclusive value="0"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Angle">
    <xsd:restriction base="xsd:int"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_Angle">
    <xsd:attribute name="val" type="ST_Angle" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_FixedAngle">
    <xsd:restriction base="ST_Angle">
      <xsd:minExclusive value="-5400000"/>
      <xsd:maxExclusive value="5400000"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PositiveFixedAngle">
    <xsd:restriction base="ST_Angle">
      <xsd:minInclusive value="0"/>
      <xsd:maxExclusive value="21600000"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PositiveFixedAngle">
    <xsd:attribute name="val" type="ST_PositiveFixedAngle" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Percentage">
    <xsd:union memberTypes="ST_PercentageDecimal s:ST_Percentage"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PercentageDecimal">
    <xsd:restriction base="xsd:int"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_Percentage">
    <xsd:attribute name="val" type="ST_Percentage" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PositivePercentage">
    <xsd:union memberTypes="ST_PositivePercentageDecimal s:ST_PositivePercentage"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PositivePercentageDecimal">
    <xsd:restriction base="ST_PercentageDecimal">
      <xsd:minInclusive value="0"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PositivePercentage">
    <xsd:attribute name="val" type="ST_PositivePercentage" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_FixedPercentage">
    <xsd:union memberTypes="ST_FixedPercentageDecimal s:ST_FixedPercentage"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FixedPercentageDecimal">
    <xsd:restriction base="ST_PercentageDecimal">
      <xsd:minInclusive value="-100000"/>
      <xsd:maxInclusive value="100000"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_FixedPercentage">
    <xsd:attribute name="val" type="ST_FixedPercentage" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PositiveFixedPercentage">
    <xsd:union memberTypes="ST_PositiveFixedPercentageDecimal s:ST_PositiveFixedPercentage"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PositiveFixedPercentageDecimal">
    <xsd:restriction base="ST_PercentageDecimal">
      <xsd:minInclusive value="0"/>
      <xsd:maxInclusive value="100000"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PositiveFixedPercentage">
    <xsd:attribute name="val" type="ST_PositiveFixedPercentage" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Ratio">
    <xsd:attribute name="n" type="xsd:long" use="required"/>
    <xsd:attribute name="d" type="xsd:long" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Point2D">
    <xsd:attribute name="x" type="ST_Coordinate" use="required"/>
    <xsd:attribute name="y" type="ST_Coordinate" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PositiveSize2D">
    <xsd:attribute name="cx" type="ST_PositiveCoordinate" use="required"/>
    <xsd:attribute name="cy" type="ST_PositiveCoordinate" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ComplementTransform"/>
  <xsd:complexType name="CT_InverseTransform"/>
  <xsd:complexType name="CT_GrayscaleTransform"/>
  <xsd:complexType name="CT_GammaTransform"/>
  <xsd:complexType name="CT_InverseGammaTransform"/>
  <xsd:group name="EG_ColorTransform">
    <xsd:choice>
      <xsd:element name="tint" type="CT_PositiveFixedPercentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="shade" type="CT_PositiveFixedPercentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="comp" type="CT_ComplementTransform" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="inv" type="CT_InverseTransform" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="gray" type="CT_GrayscaleTransform" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="alpha" type="CT_PositiveFixedPercentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="alphaOff" type="CT_FixedPercentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="alphaMod" type="CT_PositivePercentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="hue" type="CT_PositiveFixedAngle" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="hueOff" type="CT_Angle" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="hueMod" type="CT_PositivePercentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="sat" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="satOff" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="satMod" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="lum" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="lumOff" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="lumMod" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="red" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="redOff" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="redMod" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="green" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="greenOff" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="greenMod" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="blue" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="blueOff" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="blueMod" type="CT_Percentage" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="gamma" type="CT_GammaTransform" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="invGamma" type="CT_InverseGammaTransform" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_ScRgbColor">
    <xsd:sequence>
      <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="r" type="ST_Percentage" use="required"/>
    <xsd:attribute name="g" type="ST_Percentage" use="required"/>
    <xsd:attribute name="b" type="ST_Percentage" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SRgbColor">
    <xsd:sequence>
      <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="val" type="s:ST_HexColorRGB" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_HslColor">
    <xsd:sequence>
      <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="hue" type="ST_PositiveFixedAngle" use="required"/>
    <xsd:attribute name="sat" type="ST_Percentage" use="required"/>
    <xsd:attribute name="lum" type="ST_Percentage" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_SystemColorVal">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="scrollBar"/>
      <xsd:enumeration value="background"/>
      <xsd:enumeration value="activeCaption"/>
      <xsd:enumeration value="inactiveCaption"/>
      <xsd:enumeration value="menu"/>
      <xsd:enumeration value="window"/>
      <xsd:enumeration value="windowFrame"/>
      <xsd:enumeration value="menuText"/>
      <xsd:enumeration value="windowText"/>
      <xsd:enumeration value="captionText"/>
      <xsd:enumeration value="activeBorder"/>
      <xsd:enumeration value="inactiveBorder"/>
      <xsd:enumeration value="appWorkspace"/>
      <xsd:enumeration value="highlight"/>
      <xsd:enumeration value="highlightText"/>
      <xsd:enumeration value="btnFace"/>
      <xsd:enumeration value="btnShadow"/>
      <xsd:enumeration value="grayText"/>
      <xsd:enumeration value="btnText"/>
      <xsd:enumeration value="inactiveCaptionText"/>
      <xsd:enumeration value="btnHighlight"/>
      <xsd:enumeration value="3dDkShadow"/>
      <xsd:enumeration value="3dLight"/>
      <xsd:enumeration value="infoText"/>
      <xsd:enumeration value="infoBk"/>
      <xsd:enumeration value="hotLight"/>
      <xsd:enumeration value="gradientActiveCaption"/>
      <xsd:enumeration value="gradientInactiveCaption"/>
      <xsd:enumeration value="menuHighlight"/>
      <xsd:enumeration value="menuBar"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_SystemColor">
    <xsd:sequence>
      <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="val" type="ST_SystemColorVal" use="required"/>
    <xsd:attribute name="lastClr" type="s:ST_HexColorRGB" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_SchemeColorVal">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="bg1"/>
      <xsd:enumeration value="tx1"/>
      <xsd:enumeration value="bg2"/>
      <xsd:enumeration value="tx2"/>
      <xsd:enumeration value="accent1"/>
      <xsd:enumeration value="accent2"/>
      <xsd:enumeration value="accent3"/>
      <xsd:enumeration value="accent4"/>
      <xsd:enumeration value="accent5"/>
      <xsd:enumeration value="accent6"/>
      <xsd:enumeration value="hlink"/>
      <xsd:enumeration value="folHlink"/>
      <xsd:enumeration value="phClr"/>
      <xsd:enumeration value="dk1"/>
      <xsd:enumeration value="lt1"/>
      <xsd:enumeration value="dk2"/>
      <xsd:enumeration value="lt2"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_SchemeColor">
    <xsd:sequence>
      <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="val" type="ST_SchemeColorVal" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PresetColorVal">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="aliceBlue"/>
      <xsd:enumeration value="antiqueWhite"/>
      <xsd:enumeration value="aqua"/>
      <xsd:enumeration value="aquamarine"/>
      <xsd:enumeration value="azure"/>
      <xsd:enumeration value="beige"/>
      <xsd:enumeration value="bisque"/>
      <xsd:enumeration value="black"/>
      <xsd:enumeration value="blanchedAlmond"/>
      <xsd:enumeration value="blue"/>
      <xsd:enumeration value="blueViolet"/>
      <xsd:enumeration value="brown"/>
      <xsd:enumeration value="burlyWood"/>
      <xsd:enumeration value="cadetBlue"/>
      <xsd:enumeration value="chartreuse"/>
      <xsd:enumeration value="chocolate"/>
      <xsd:enumeration value="coral"/>
      <xsd:enumeration value="cornflowerBlue"/>
      <xsd:enumeration value="cornsilk"/>
      <xsd:enumeration value="crimson"/>
      <xsd:enumeration value="cyan"/>
      <xsd:enumeration value="darkBlue"/>
      <xsd:enumeration value="darkCyan"/>
      <xsd:enumeration value="darkGoldenrod"/>
      <xsd:enumeration value="darkGray"/>
      <xsd:enumeration value="darkGrey"/>
      <xsd:enumeration value="darkGreen"/>
      <xsd:enumeration value="darkKhaki"/>
      <xsd:enumeration value="darkMagenta"/>
      <xsd:enumeration value="darkOliveGreen"/>
      <xsd:enumeration value="darkOrange"/>
      <xsd:enumeration value="darkOrchid"/>
      <xsd:enumeration value="darkRed"/>
      <xsd:enumeration value="darkSalmon"/>
      <xsd:enumeration value="darkSeaGreen"/>
      <xsd:enumeration value="darkSlateBlue"/>
      <xsd:enumeration value="darkSlateGray"/>
      <xsd:enumeration value="darkSlateGrey"/>
      <xsd:enumeration value="darkTurquoise"/>
      <xsd:enumeration value="darkViolet"/>
      <xsd:enumeration value="dkBlue"/>
      <xsd:enumeration value="dkCyan"/>
      <xsd:enumeration value="dkGoldenrod"/>
      <xsd:enumeration value="dkGray"/>
      <xsd:enumeration value="dkGrey"/>
      <xsd:enumeration value="dkGreen"/>
      <xsd:enumeration value="dkKhaki"/>
      <xsd:enumeration value="dkMagenta"/>
      <xsd:enumeration value="dkOliveGreen"/>
      <xsd:enumeration value="dkOrange"/>
      <xsd:enumeration value="dkOrchid"/>
      <xsd:enumeration value="dkRed"/>
      <xsd:enumeration value="dkSalmon"/>
      <xsd:enumeration value="dkSeaGreen"/>
      <xsd:enumeration value="dkSlateBlue"/>
      <xsd:enumeration value="dkSlateGray"/>
      <xsd:enumeration value="dkSlateGrey"/>
      <xsd:enumeration value="dkTurquoise"/>
      <xsd:enumeration value="dkViolet"/>
      <xsd:enumeration value="deepPink"/>
      <xsd:enumeration value="deepSkyBlue"/>
      <xsd:enumeration value="dimGray"/>
      <xsd:enumeration value="dimGrey"/>
      <xsd:enumeration value="dodgerBlue"/>
      <xsd:enumeration value="firebrick"/>
      <xsd:enumeration value="floralWhite"/>
      <xsd:enumeration value="forestGreen"/>
      <xsd:enumeration value="fuchsia"/>
      <xsd:enumeration value="gainsboro"/>
      <xsd:enumeration value="ghostWhite"/>
      <xsd:enumeration value="gold"/>
      <xsd:enumeration value="goldenrod"/>
      <xsd:enumeration value="gray"/>
      <xsd:enumeration value="grey"/>
      <xsd:enumeration value="green"/>
      <xsd:enumeration value="greenYellow"/>
      <xsd:enumeration value="honeydew"/>
      <xsd:enumeration value="hotPink"/>
      <xsd:enumeration value="indianRed"/>
      <xsd:enumeration value="indigo"/>
      <xsd:enumeration value="ivory"/>
      <xsd:enumeration value="khaki"/>
      <xsd:enumeration value="lavender"/>
      <xsd:enumeration value="lavenderBlush"/>
      <xsd:enumeration value="lawnGreen"/>
      <xsd:enumeration value="lemonChiffon"/>
      <xsd:enumeration value="lightBlue"/>
      <xsd:enumeration value="lightCoral"/>
      <xsd:enumeration value="lightCyan"/>
      <xsd:enumeration value="lightGoldenrodYellow"/>
      <xsd:enumeration value="lightGray"/>
      <xsd:enumeration value="lightGrey"/>
      <xsd:enumeration value="lightGreen"/>
      <xsd:enumeration value="lightPink"/>
      <xsd:enumeration value="lightSalmon"/>
      <xsd:enumeration value="lightSeaGreen"/>
      <xsd:enumeration value="lightSkyBlue"/>
      <xsd:enumeration value="lightSlateGray"/>
      <xsd:enumeration value="lightSlateGrey"/>
      <xsd:enumeration value="lightSteelBlue"/>
      <xsd:enumeration value="lightYellow"/>
      <xsd:enumeration value="ltBlue"/>
      <xsd:enumeration value="ltCoral"/>
      <xsd:enumeration value="ltCyan"/>
      <xsd:enumeration value="ltGoldenrodYellow"/>
      <xsd:enumeration value="ltGray"/>
      <xsd:enumeration value="ltGrey"/>
      <xsd:enumeration value="ltGreen"/>
      <xsd:enumeration value="ltPink"/>
      <xsd:enumeration value="ltSalmon"/>
      <xsd:enumeration value="ltSeaGreen"/>
      <xsd:enumeration value="ltSkyBlue"/>
      <xsd:enumeration value="ltSlateGray"/>
      <xsd:enumeration value="ltSlateGrey"/>
      <xsd:enumeration value="ltSteelBlue"/>
      <xsd:enumeration value="ltYellow"/>
      <xsd:enumeration value="lime"/>
      <xsd:enumeration value="limeGreen"/>
      <xsd:enumeration value="linen"/>
      <xsd:enumeration value="magenta"/>
      <xsd:enumeration value="maroon"/>
      <xsd:enumeration value="medAquamarine"/>
      <xsd:enumeration value="medBlue"/>
      <xsd:enumeration value="medOrchid"/>
      <xsd:enumeration value="medPurple"/>
      <xsd:enumeration value="medSeaGreen"/>
      <xsd:enumeration value="medSlateBlue"/>
      <xsd:enumeration value="medSpringGreen"/>
      <xsd:enumeration value="medTurquoise"/>
      <xsd:enumeration value="medVioletRed"/>
      <xsd:enumeration value="mediumAquamarine"/>
      <xsd:enumeration value="mediumBlue"/>
      <xsd:enumeration value="mediumOrchid"/>
      <xsd:enumeration value="mediumPurple"/>
      <xsd:enumeration value="mediumSeaGreen"/>
      <xsd:enumeration value="mediumSlateBlue"/>
      <xsd:enumeration value="mediumSpringGreen"/>
      <xsd:enumeration value="mediumTurquoise"/>
      <xsd:enumeration value="mediumVioletRed"/>
      <xsd:enumeration value="midnightBlue"/>
      <xsd:enumeration value="mintCream"/>
      <xsd:enumeration value="mistyRose"/>
      <xsd:enumeration value="moccasin"/>
      <xsd:enumeration value="navajoWhite"/>
      <xsd:enumeration value="navy"/>
      <xsd:enumeration value="oldLace"/>
      <xsd:enumeration value="olive"/>
      <xsd:enumeration value="oliveDrab"/>
      <xsd:enumeration value="orange"/>
      <xsd:enumeration value="orangeRed"/>
      <xsd:enumeration value="orchid"/>
      <xsd:enumeration value="paleGoldenrod"/>
      <xsd:enumeration value="paleGreen"/>
      <xsd:enumeration value="paleTurquoise"/>
      <xsd:enumeration value="paleVioletRed"/>
      <xsd:enumeration value="papayaWhip"/>
      <xsd:enumeration value="peachPuff"/>
      <xsd:enumeration value="peru"/>
      <xsd:enumeration value="pink"/>
      <xsd:enumeration value="plum"/>
      <xsd:enumeration value="powderBlue"/>
      <xsd:enumeration value="purple"/>
      <xsd:enumeration value="red"/>
      <xsd:enumeration value="rosyBrown"/>
      <xsd:enumeration value="royalBlue"/>
      <xsd:enumeration value="saddleBrown"/>
      <xsd:enumeration value="salmon"/>
      <xsd:enumeration value="sandyBrown"/>
      <xsd:enumeration value="seaGreen"/>
      <xsd:enumeration value="seaShell"/>
      <xsd:enumeration value="sienna"/>
      <xsd:enumeration value="silver"/>
      <xsd:enumeration value="skyBlue"/>
      <xsd:enumeration value="slateBlue"/>
      <xsd:enumeration value="slateGray"/>
      <xsd:enumeration value="slateGrey"/>
      <xsd:enumeration value="snow"/>
      <xsd:enumeration value="springGreen"/>
      <xsd:enumeration value="steelBlue"/>
      <xsd:enumeration value="tan"/>
      <xsd:enumeration value="teal"/>
      <xsd:enumeration value="thistle"/>
      <xsd:enumeration value="tomato"/>
      <xsd:enumeration value="turquoise"/>
      <xsd:enumeration value="violet"/>
      <xsd:enumeration value="wheat"/>
      <xsd:enumeration value="white"/>
      <xsd:enumeration value="whiteSmoke"/>
      <xsd:enumeration value="yellow"/>
      <xsd:enumeration value="yellowGreen"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PresetColor">
    <xsd:sequence>
      <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="val" type="ST_PresetColorVal" use="required"/>
  </xsd:complexType>
  <xsd:group name="EG_OfficeArtExtensionList">
    <xsd:sequence>
      <xsd:element name="ext" type="CT_OfficeArtExtension" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:group>
  <xsd:complexType name="CT_OfficeArtExtensionList">
    <xsd:sequence>
      <xsd:group ref="EG_OfficeArtExtensionList" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Scale2D">
    <xsd:sequence>
      <xsd:element name="sx" type="CT_Ratio" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="sy" type="CT_Ratio" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Transform2D">
    <xsd:sequence>
      <xsd:element name="off" type="CT_Point2D" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="ext" type="CT_PositiveSize2D" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="rot" type="ST_Angle" use="optional" default="0"/>
    <xsd:attribute name="flipH" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="flipV" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GroupTransform2D">
    <xsd:sequence>
      <xsd:element name="off" type="CT_Point2D" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="ext" type="CT_PositiveSize2D" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="chOff" type="CT_Point2D" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="chExt" type="CT_PositiveSize2D" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="rot" type="ST_Angle" use="optional" default="0"/>
    <xsd:attribute name="flipH" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="flipV" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Point3D">
    <xsd:attribute name="x" type="ST_Coordinate" use="required"/>
    <xsd:attribute name="y" type="ST_Coordinate" use="required"/>
    <xsd:attribute name="z" type="ST_Coordinate" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Vector3D">
    <xsd:attribute name="dx" type="ST_Coordinate" use="required"/>
    <xsd:attribute name="dy" type="ST_Coordinate" use="required"/>
    <xsd:attribute name="dz" type="ST_Coordinate" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SphereCoords">
    <xsd:attribute name="lat" type="ST_PositiveFixedAngle" use="required"/>
    <xsd:attribute name="lon" type="ST_PositiveFixedAngle" use="required"/>
    <xsd:attribute name="rev" type="ST_PositiveFixedAngle" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RelativeRect">
    <xsd:attribute name="l" type="ST_Percentage" use="optional" default="0%"/>
    <xsd:attribute name="t" type="ST_Percentage" use="optional" default="0%"/>
    <xsd:attribute name="r" type="ST_Percentage" use="optional" default="0%"/>
    <xsd:attribute name="b" type="ST_Percentage" use="optional" default="0%"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_RectAlignment">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="tl"/>
      <xsd:enumeration value="t"/>
      <xsd:enumeration value="tr"/>
      <xsd:enumeration value="l"/>
      <xsd:enumeration value="ctr"/>
      <xsd:enumeration value="r"/>
      <xsd:enumeration value="bl"/>
      <xsd:enumeration value="b"/>
      <xsd:enumeration value="br"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:group name="EG_ColorChoice">
    <xsd:choice>
      <xsd:element name="scrgbClr" type="CT_ScRgbColor" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="srgbClr" type="CT_SRgbColor" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="hslClr" type="CT_HslColor" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="sysClr" type="CT_SystemColor" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="schemeClr" type="CT_SchemeColor" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="prstClr" type="CT_PresetColor" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_Color">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ColorMRU">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_BlackWhiteMode">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="clr"/>
      <xsd:enumeration value="auto"/>
      <xsd:enumeration value="gray"/>
      <xsd:enumeration value="ltGray"/>
      <xsd:enumeration value="invGray"/>
      <xsd:enumeration value="grayWhite"/>
      <xsd:enumeration value="blackGray"/>
      <xsd:enumeration value="blackWhite"/>
      <xsd:enumeration value="black"/>
      <xsd:enumeration value="white"/>
      <xsd:enumeration value="hidden"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:attributeGroup name="AG_Blob">
    <xsd:attribute ref="r:embed" use="optional" default=""/>
    <xsd:attribute ref="r:link" use="optional" default=""/>
  </xsd:attributeGroup>
  <xsd:complexType name="CT_EmbeddedWAVAudioFile">
    <xsd:attribute ref="r:embed" use="required"/>
    <xsd:attribute name="name" type="xsd:string" use="optional" default=""/>
  </xsd:complexType>
  <xsd:complexType name="CT_Hyperlink">
    <xsd:sequence>
      <xsd:element name="snd" type="CT_EmbeddedWAVAudioFile" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute ref="r:id" use="optional"/>
    <xsd:attribute name="invalidUrl" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="action" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="tgtFrame" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="tooltip" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="history" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="highlightClick" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="endSnd" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DrawingElementId">
    <xsd:restriction base="xsd:unsignedInt"/>
  </xsd:simpleType>
  <xsd:attributeGroup name="AG_Locking">
    <xsd:attribute name="noGrp" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noSelect" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noRot" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noChangeAspect" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noMove" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noResize" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noEditPoints" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noAdjustHandles" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noChangeArrowheads" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noChangeShapeType" type="xsd:boolean" use="optional" default="false"/>
  </xsd:attributeGroup>
  <xsd:complexType name="CT_ConnectorLocking">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_Locking"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ShapeLocking">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_Locking"/>
    <xsd:attribute name="noTextEdit" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PictureLocking">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_Locking"/>
    <xsd:attribute name="noCrop" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GroupLocking">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="noGrp" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noUngrp" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noSelect" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noRot" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noChangeAspect" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noMove" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noResize" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GraphicalObjectFrameLocking">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="noGrp" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noDrilldown" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noSelect" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noChangeAspect" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noMove" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="noResize" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ContentPartLocking">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_Locking"/>
  </xsd:complexType>
  <xsd:complexType name="CT_NonVisualDrawingProps">
    <xsd:sequence>
      <xsd:element name="hlinkClick" type="CT_Hyperlink" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="hlinkHover" type="CT_Hyperlink" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="id" type="ST_DrawingElementId" use="required"/>
    <xsd:attribute name="name" type="xsd:string" use="required"/>
    <xsd:attribute name="descr" type="xsd:string" use="optional" default=""/>
    <xsd:attribute name="hidden" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="title" type="xsd:string" use="optional" default=""/>
  </xsd:complexType>
  <xsd:complexType name="CT_NonVisualDrawingShapeProps">
    <xsd:sequence>
      <xsd:element name="spLocks" type="CT_ShapeLocking" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="txBox" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_NonVisualConnectorProperties">
    <xsd:sequence>
      <xsd:element name="cxnSpLocks" type="CT_ConnectorLocking" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="stCxn" type="CT_Connection" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="endCxn" type="CT_Connection" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_NonVisualPictureProperties">
    <xsd:sequence>
      <xsd:element name="picLocks" type="CT_PictureLocking" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="preferRelativeResize" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_NonVisualGroupDrawingShapeProps">
    <xsd:sequence>
      <xsd:element name="grpSpLocks" type="CT_GroupLocking" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_NonVisualGraphicFrameProperties">
    <xsd:sequence>
      <xsd:element name="graphicFrameLocks" type="CT_GraphicalObjectFrameLocking" minOccurs="0"
        maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_NonVisualContentPartProperties">
    <xsd:sequence>
      <xsd:element name="cpLocks" type="CT_ContentPartLocking" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="isComment" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GraphicalObjectData">
    <xsd:sequence>
      <xsd:any minOccurs="0" maxOccurs="unbounded" processContents="strict"/>
    </xsd:sequence>
    <xsd:attribute name="uri" type="xsd:token" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GraphicalObject">
    <xsd:sequence>
      <xsd:element name="graphicData" type="CT_GraphicalObjectData"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="graphic" type="CT_GraphicalObject"/>
  <xsd:simpleType name="ST_ChartBuildStep">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="category"/>
      <xsd:enumeration value="ptInCategory"/>
      <xsd:enumeration value="series"/>
      <xsd:enumeration value="ptInSeries"/>
      <xsd:enumeration value="allPts"/>
      <xsd:enumeration value="gridLegend"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_DgmBuildStep">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="sp"/>
      <xsd:enumeration value="bg"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_AnimationDgmElement">
    <xsd:attribute name="id" type="s:ST_Guid" use="optional"
      default="{00000000-0000-0000-0000-000000000000}"/>
    <xsd:attribute name="bldStep" type="ST_DgmBuildStep" use="optional" default="sp"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AnimationChartElement">
    <xsd:attribute name="seriesIdx" type="xsd:int" use="optional" default="-1"/>
    <xsd:attribute name="categoryIdx" type="xsd:int" use="optional" default="-1"/>
    <xsd:attribute name="bldStep" type="ST_ChartBuildStep" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AnimationElementChoice">
    <xsd:choice minOccurs="1" maxOccurs="1">
      <xsd:element name="dgm" type="CT_AnimationDgmElement"/>
      <xsd:element name="chart" type="CT_AnimationChartElement"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:simpleType name="ST_AnimationBuildType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="allAtOnce"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_AnimationDgmOnlyBuildType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="one"/>
      <xsd:enumeration value="lvlOne"/>
      <xsd:enumeration value="lvlAtOnce"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_AnimationDgmBuildType">
    <xsd:union memberTypes="ST_AnimationBuildType ST_AnimationDgmOnlyBuildType"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_AnimationDgmBuildProperties">
    <xsd:attribute name="bld" type="ST_AnimationDgmBuildType" use="optional" default="allAtOnce"/>
    <xsd:attribute name="rev" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_AnimationChartOnlyBuildType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="series"/>
      <xsd:enumeration value="category"/>
      <xsd:enumeration value="seriesEl"/>
      <xsd:enumeration value="categoryEl"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_AnimationChartBuildType">
    <xsd:union memberTypes="ST_AnimationBuildType ST_AnimationChartOnlyBuildType"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_AnimationChartBuildProperties">
    <xsd:attribute name="bld" type="ST_AnimationChartBuildType" use="optional" default="allAtOnce"/>
    <xsd:attribute name="animBg" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AnimationGraphicalObjectBuildProperties">
    <xsd:choice>
      <xsd:element name="bldDgm" type="CT_AnimationDgmBuildProperties"/>
      <xsd:element name="bldChart" type="CT_AnimationChartBuildProperties"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:complexType name="CT_BackgroundFormatting">
    <xsd:sequence>
      <xsd:group ref="EG_FillProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_EffectProperties" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_WholeE2oFormatting">
    <xsd:sequence>
      <xsd:element name="ln" type="CT_LineProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_EffectProperties" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_GvmlUseShapeRectangle"/>
  <xsd:complexType name="CT_GvmlTextShape">
    <xsd:sequence>
      <xsd:element name="txBody" type="CT_TextBody" minOccurs="1" maxOccurs="1"/>
      <xsd:choice>
        <xsd:element name="useSpRect" type="CT_GvmlUseShapeRectangle" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="xfrm" type="CT_Transform2D" minOccurs="1" maxOccurs="1"/>
      </xsd:choice>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_GvmlShapeNonVisual">
    <xsd:sequence>
      <xsd:element name="cNvPr" type="CT_NonVisualDrawingProps" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="cNvSpPr" type="CT_NonVisualDrawingShapeProps" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_GvmlShape">
    <xsd:sequence>
      <xsd:element name="nvSpPr" type="CT_GvmlShapeNonVisual" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="spPr" type="CT_ShapeProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="txSp" type="CT_GvmlTextShape" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="style" type="CT_ShapeStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_GvmlConnectorNonVisual">
    <xsd:sequence>
      <xsd:element name="cNvPr" type="CT_NonVisualDrawingProps" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="cNvCxnSpPr" type="CT_NonVisualConnectorProperties" minOccurs="1"
        maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_GvmlConnector">
    <xsd:sequence>
      <xsd:element name="nvCxnSpPr" type="CT_GvmlConnectorNonVisual" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="spPr" type="CT_ShapeProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="style" type="CT_ShapeStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_GvmlPictureNonVisual">
    <xsd:sequence>
      <xsd:element name="cNvPr" type="CT_NonVisualDrawingProps" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="cNvPicPr" type="CT_NonVisualPictureProperties" minOccurs="1" maxOccurs="1"
      />
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_GvmlPicture">
    <xsd:sequence>
      <xsd:element name="nvPicPr" type="CT_GvmlPictureNonVisual" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="blipFill" type="CT_BlipFillProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="spPr" type="CT_ShapeProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="style" type="CT_ShapeStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_GvmlGraphicFrameNonVisual">
    <xsd:sequence>
      <xsd:element name="cNvPr" type="CT_NonVisualDrawingProps" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="cNvGraphicFramePr" type="CT_NonVisualGraphicFrameProperties" minOccurs="1"
        maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_GvmlGraphicalObjectFrame">
    <xsd:sequence>
      <xsd:element name="nvGraphicFramePr" type="CT_GvmlGraphicFrameNonVisual" minOccurs="1"
        maxOccurs="1"/>
      <xsd:element ref="graphic" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="xfrm" type="CT_Transform2D" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_GvmlGroupShapeNonVisual">
    <xsd:sequence>
      <xsd:element name="cNvPr" type="CT_NonVisualDrawingProps" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="cNvGrpSpPr" type="CT_NonVisualGroupDrawingShapeProps" minOccurs="1"
        maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_GvmlGroupShape">
    <xsd:sequence>
      <xsd:element name="nvGrpSpPr" type="CT_GvmlGroupShapeNonVisual" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="grpSpPr" type="CT_GroupShapeProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:choice minOccurs="0" maxOccurs="unbounded">
        <xsd:element name="txSp" type="CT_GvmlTextShape"/>
        <xsd:element name="sp" type="CT_GvmlShape"/>
        <xsd:element name="cxnSp" type="CT_GvmlConnector"/>
        <xsd:element name="pic" type="CT_GvmlPicture"/>
        <xsd:element name="graphicFrame" type="CT_GvmlGraphicalObjectFrame"/>
        <xsd:element name="grpSp" type="CT_GvmlGroupShape"/>
      </xsd:choice>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_PresetCameraType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="legacyObliqueTopLeft"/>
      <xsd:enumeration value="legacyObliqueTop"/>
      <xsd:enumeration value="legacyObliqueTopRight"/>
      <xsd:enumeration value="legacyObliqueLeft"/>
      <xsd:enumeration value="legacyObliqueFront"/>
      <xsd:enumeration value="legacyObliqueRight"/>
      <xsd:enumeration value="legacyObliqueBottomLeft"/>
      <xsd:enumeration value="legacyObliqueBottom"/>
      <xsd:enumeration value="legacyObliqueBottomRight"/>
      <xsd:enumeration value="legacyPerspectiveTopLeft"/>
      <xsd:enumeration value="legacyPerspectiveTop"/>
      <xsd:enumeration value="legacyPerspectiveTopRight"/>
      <xsd:enumeration value="legacyPerspectiveLeft"/>
      <xsd:enumeration value="legacyPerspectiveFront"/>
      <xsd:enumeration value="legacyPerspectiveRight"/>
      <xsd:enumeration value="legacyPerspectiveBottomLeft"/>
      <xsd:enumeration value="legacyPerspectiveBottom"/>
      <xsd:enumeration value="legacyPerspectiveBottomRight"/>
      <xsd:enumeration value="orthographicFront"/>
      <xsd:enumeration value="isometricTopUp"/>
      <xsd:enumeration value="isometricTopDown"/>
      <xsd:enumeration value="isometricBottomUp"/>
      <xsd:enumeration value="isometricBottomDown"/>
      <xsd:enumeration value="isometricLeftUp"/>
      <xsd:enumeration value="isometricLeftDown"/>
      <xsd:enumeration value="isometricRightUp"/>
      <xsd:enumeration value="isometricRightDown"/>
      <xsd:enumeration value="isometricOffAxis1Left"/>
      <xsd:enumeration value="isometricOffAxis1Right"/>
      <xsd:enumeration value="isometricOffAxis1Top"/>
      <xsd:enumeration value="isometricOffAxis2Left"/>
      <xsd:enumeration value="isometricOffAxis2Right"/>
      <xsd:enumeration value="isometricOffAxis2Top"/>
      <xsd:enumeration value="isometricOffAxis3Left"/>
      <xsd:enumeration value="isometricOffAxis3Right"/>
      <xsd:enumeration value="isometricOffAxis3Bottom"/>
      <xsd:enumeration value="isometricOffAxis4Left"/>
      <xsd:enumeration value="isometricOffAxis4Right"/>
      <xsd:enumeration value="isometricOffAxis4Bottom"/>
      <xsd:enumeration value="obliqueTopLeft"/>
      <xsd:enumeration value="obliqueTop"/>
      <xsd:enumeration value="obliqueTopRight"/>
      <xsd:enumeration value="obliqueLeft"/>
      <xsd:enumeration value="obliqueRight"/>
      <xsd:enumeration value="obliqueBottomLeft"/>
      <xsd:enumeration value="obliqueBottom"/>
      <xsd:enumeration value="obliqueBottomRight"/>
      <xsd:enumeration value="perspectiveFront"/>
      <xsd:enumeration value="perspectiveLeft"/>
      <xsd:enumeration value="perspectiveRight"/>
      <xsd:enumeration value="perspectiveAbove"/>
      <xsd:enumeration value="perspectiveBelow"/>
      <xsd:enumeration value="perspectiveAboveLeftFacing"/>
      <xsd:enumeration value="perspectiveAboveRightFacing"/>
      <xsd:enumeration value="perspectiveContrastingLeftFacing"/>
      <xsd:enumeration value="perspectiveContrastingRightFacing"/>
      <xsd:enumeration value="perspectiveHeroicLeftFacing"/>
      <xsd:enumeration value="perspectiveHeroicRightFacing"/>
      <xsd:enumeration value="perspectiveHeroicExtremeLeftFacing"/>
      <xsd:enumeration value="perspectiveHeroicExtremeRightFacing"/>
      <xsd:enumeration value="perspectiveRelaxed"/>
      <xsd:enumeration value="perspectiveRelaxedModerately"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FOVAngle">
    <xsd:restriction base="ST_Angle">
      <xsd:minInclusive value="0"/>
      <xsd:maxInclusive value="10800000"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Camera">
    <xsd:sequence>
      <xsd:element name="rot" type="CT_SphereCoords" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="prst" type="ST_PresetCameraType" use="required"/>
    <xsd:attribute name="fov" type="ST_FOVAngle" use="optional"/>
    <xsd:attribute name="zoom" type="ST_PositivePercentage" use="optional" default="100%"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_LightRigDirection">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="tl"/>
      <xsd:enumeration value="t"/>
      <xsd:enumeration value="tr"/>
      <xsd:enumeration value="l"/>
      <xsd:enumeration value="r"/>
      <xsd:enumeration value="bl"/>
      <xsd:enumeration value="b"/>
      <xsd:enumeration value="br"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_LightRigType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="legacyFlat1"/>
      <xsd:enumeration value="legacyFlat2"/>
      <xsd:enumeration value="legacyFlat3"/>
      <xsd:enumeration value="legacyFlat4"/>
      <xsd:enumeration value="legacyNormal1"/>
      <xsd:enumeration value="legacyNormal2"/>
      <xsd:enumeration value="legacyNormal3"/>
      <xsd:enumeration value="legacyNormal4"/>
      <xsd:enumeration value="legacyHarsh1"/>
      <xsd:enumeration value="legacyHarsh2"/>
      <xsd:enumeration value="legacyHarsh3"/>
      <xsd:enumeration value="legacyHarsh4"/>
      <xsd:enumeration value="threePt"/>
      <xsd:enumeration value="balanced"/>
      <xsd:enumeration value="soft"/>
      <xsd:enumeration value="harsh"/>
      <xsd:enumeration value="flood"/>
      <xsd:enumeration value="contrasting"/>
      <xsd:enumeration value="morning"/>
      <xsd:enumeration value="sunrise"/>
      <xsd:enumeration value="sunset"/>
      <xsd:enumeration value="chilly"/>
      <xsd:enumeration value="freezing"/>
      <xsd:enumeration value="flat"/>
      <xsd:enumeration value="twoPt"/>
      <xsd:enumeration value="glow"/>
      <xsd:enumeration value="brightRoom"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_LightRig">
    <xsd:sequence>
      <xsd:element name="rot" type="CT_SphereCoords" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="rig" type="ST_LightRigType" use="required"/>
    <xsd:attribute name="dir" type="ST_LightRigDirection" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Scene3D">
    <xsd:sequence>
      <xsd:element name="camera" type="CT_Camera" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="lightRig" type="CT_LightRig" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="backdrop" type="CT_Backdrop" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Backdrop">
    <xsd:sequence>
      <xsd:element name="anchor" type="CT_Point3D" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="norm" type="CT_Vector3D" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="up" type="CT_Vector3D" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_BevelPresetType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="relaxedInset"/>
      <xsd:enumeration value="circle"/>
      <xsd:enumeration value="slope"/>
      <xsd:enumeration value="cross"/>
      <xsd:enumeration value="angle"/>
      <xsd:enumeration value="softRound"/>
      <xsd:enumeration value="convex"/>
      <xsd:enumeration value="coolSlant"/>
      <xsd:enumeration value="divot"/>
      <xsd:enumeration value="riblet"/>
      <xsd:enumeration value="hardEdge"/>
      <xsd:enumeration value="artDeco"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Bevel">
    <xsd:attribute name="w" type="ST_PositiveCoordinate" use="optional" default="76200"/>
    <xsd:attribute name="h" type="ST_PositiveCoordinate" use="optional" default="76200"/>
    <xsd:attribute name="prst" type="ST_BevelPresetType" use="optional" default="circle"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PresetMaterialType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="legacyMatte"/>
      <xsd:enumeration value="legacyPlastic"/>
      <xsd:enumeration value="legacyMetal"/>
      <xsd:enumeration value="legacyWireframe"/>
      <xsd:enumeration value="matte"/>
      <xsd:enumeration value="plastic"/>
      <xsd:enumeration value="metal"/>
      <xsd:enumeration value="warmMatte"/>
      <xsd:enumeration value="translucentPowder"/>
      <xsd:enumeration value="powder"/>
      <xsd:enumeration value="dkEdge"/>
      <xsd:enumeration value="softEdge"/>
      <xsd:enumeration value="clear"/>
      <xsd:enumeration value="flat"/>
      <xsd:enumeration value="softmetal"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Shape3D">
    <xsd:sequence>
      <xsd:element name="bevelT" type="CT_Bevel" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="bevelB" type="CT_Bevel" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extrusionClr" type="CT_Color" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="contourClr" type="CT_Color" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="z" type="ST_Coordinate" use="optional" default="0"/>
    <xsd:attribute name="extrusionH" type="ST_PositiveCoordinate" use="optional" default="0"/>
    <xsd:attribute name="contourW" type="ST_PositiveCoordinate" use="optional" default="0"/>
    <xsd:attribute name="prstMaterial" type="ST_PresetMaterialType" use="optional"
      default="warmMatte"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FlatText">
    <xsd:attribute name="z" type="ST_Coordinate" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:group name="EG_Text3D">
    <xsd:choice>
      <xsd:element name="sp3d" type="CT_Shape3D" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="flatTx" type="CT_FlatText" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_AlphaBiLevelEffect">
    <xsd:attribute name="thresh" type="ST_PositiveFixedPercentage" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AlphaCeilingEffect"/>
  <xsd:complexType name="CT_AlphaFloorEffect"/>
  <xsd:complexType name="CT_AlphaInverseEffect">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_AlphaModulateFixedEffect">
    <xsd:attribute name="amt" type="ST_PositivePercentage" use="optional" default="100%"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AlphaOutsetEffect">
    <xsd:attribute name="rad" type="ST_Coordinate" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AlphaReplaceEffect">
    <xsd:attribute name="a" type="ST_PositiveFixedPercentage" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_BiLevelEffect">
    <xsd:attribute name="thresh" type="ST_PositiveFixedPercentage" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_BlurEffect">
    <xsd:attribute name="rad" type="ST_PositiveCoordinate" use="optional" default="0"/>
    <xsd:attribute name="grow" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ColorChangeEffect">
    <xsd:sequence>
      <xsd:element name="clrFrom" type="CT_Color" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="clrTo" type="CT_Color" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="useA" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ColorReplaceEffect">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_DuotoneEffect">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice" minOccurs="2" maxOccurs="2"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_GlowEffect">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="rad" type="ST_PositiveCoordinate" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GrayscaleEffect"/>
  <xsd:complexType name="CT_HSLEffect">
    <xsd:attribute name="hue" type="ST_PositiveFixedAngle" use="optional" default="0"/>
    <xsd:attribute name="sat" type="ST_FixedPercentage" use="optional" default="0%"/>
    <xsd:attribute name="lum" type="ST_FixedPercentage" use="optional" default="0%"/>
  </xsd:complexType>
  <xsd:complexType name="CT_InnerShadowEffect">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="blurRad" type="ST_PositiveCoordinate" use="optional" default="0"/>
    <xsd:attribute name="dist" type="ST_PositiveCoordinate" use="optional" default="0"/>
    <xsd:attribute name="dir" type="ST_PositiveFixedAngle" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_LuminanceEffect">
    <xsd:attribute name="bright" type="ST_FixedPercentage" use="optional" default="0%"/>
    <xsd:attribute name="contrast" type="ST_FixedPercentage" use="optional" default="0%"/>
  </xsd:complexType>
  <xsd:complexType name="CT_OuterShadowEffect">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="blurRad" type="ST_PositiveCoordinate" use="optional" default="0"/>
    <xsd:attribute name="dist" type="ST_PositiveCoordinate" use="optional" default="0"/>
    <xsd:attribute name="dir" type="ST_PositiveFixedAngle" use="optional" default="0"/>
    <xsd:attribute name="sx" type="ST_Percentage" use="optional" default="100%"/>
    <xsd:attribute name="sy" type="ST_Percentage" use="optional" default="100%"/>
    <xsd:attribute name="kx" type="ST_FixedAngle" use="optional" default="0"/>
    <xsd:attribute name="ky" type="ST_FixedAngle" use="optional" default="0"/>
    <xsd:attribute name="algn" type="ST_RectAlignment" use="optional" default="b"/>
    <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PresetShadowVal">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="shdw1"/>
      <xsd:enumeration value="shdw2"/>
      <xsd:enumeration value="shdw3"/>
      <xsd:enumeration value="shdw4"/>
      <xsd:enumeration value="shdw5"/>
      <xsd:enumeration value="shdw6"/>
      <xsd:enumeration value="shdw7"/>
      <xsd:enumeration value="shdw8"/>
      <xsd:enumeration value="shdw9"/>
      <xsd:enumeration value="shdw10"/>
      <xsd:enumeration value="shdw11"/>
      <xsd:enumeration value="shdw12"/>
      <xsd:enumeration value="shdw13"/>
      <xsd:enumeration value="shdw14"/>
      <xsd:enumeration value="shdw15"/>
      <xsd:enumeration value="shdw16"/>
      <xsd:enumeration value="shdw17"/>
      <xsd:enumeration value="shdw18"/>
      <xsd:enumeration value="shdw19"/>
      <xsd:enumeration value="shdw20"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PresetShadowEffect">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="prst" type="ST_PresetShadowVal" use="required"/>
    <xsd:attribute name="dist" type="ST_PositiveCoordinate" use="optional" default="0"/>
    <xsd:attribute name="dir" type="ST_PositiveFixedAngle" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ReflectionEffect">
    <xsd:attribute name="blurRad" type="ST_PositiveCoordinate" use="optional" default="0"/>
    <xsd:attribute name="stA" type="ST_PositiveFixedPercentage" use="optional" default="100%"/>
    <xsd:attribute name="stPos" type="ST_PositiveFixedPercentage" use="optional" default="0%"/>
    <xsd:attribute name="endA" type="ST_PositiveFixedPercentage" use="optional" default="0%"/>
    <xsd:attribute name="endPos" type="ST_PositiveFixedPercentage" use="optional" default="100%"/>
    <xsd:attribute name="dist" type="ST_PositiveCoordinate" use="optional" default="0"/>
    <xsd:attribute name="dir" type="ST_PositiveFixedAngle" use="optional" default="0"/>
    <xsd:attribute name="fadeDir" type="ST_PositiveFixedAngle" use="optional" default="5400000"/>
    <xsd:attribute name="sx" type="ST_Percentage" use="optional" default="100%"/>
    <xsd:attribute name="sy" type="ST_Percentage" use="optional" default="100%"/>
    <xsd:attribute name="kx" type="ST_FixedAngle" use="optional" default="0"/>
    <xsd:attribute name="ky" type="ST_FixedAngle" use="optional" default="0"/>
    <xsd:attribute name="algn" type="ST_RectAlignment" use="optional" default="b"/>
    <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RelativeOffsetEffect">
    <xsd:attribute name="tx" type="ST_Percentage" use="optional" default="0%"/>
    <xsd:attribute name="ty" type="ST_Percentage" use="optional" default="0%"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SoftEdgesEffect">
    <xsd:attribute name="rad" type="ST_PositiveCoordinate" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TintEffect">
    <xsd:attribute name="hue" type="ST_PositiveFixedAngle" use="optional" default="0"/>
    <xsd:attribute name="amt" type="ST_FixedPercentage" use="optional" default="0%"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TransformEffect">
    <xsd:attribute name="sx" type="ST_Percentage" use="optional" default="100%"/>
    <xsd:attribute name="sy" type="ST_Percentage" use="optional" default="100%"/>
    <xsd:attribute name="kx" type="ST_FixedAngle" use="optional" default="0"/>
    <xsd:attribute name="ky" type="ST_FixedAngle" use="optional" default="0"/>
    <xsd:attribute name="tx" type="ST_Coordinate" use="optional" default="0"/>
    <xsd:attribute name="ty" type="ST_Coordinate" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_NoFillProperties"/>
  <xsd:complexType name="CT_SolidColorFillProperties">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_LinearShadeProperties">
    <xsd:attribute name="ang" type="ST_PositiveFixedAngle" use="optional"/>
    <xsd:attribute name="scaled" type="xsd:boolean" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PathShadeType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="shape"/>
      <xsd:enumeration value="circle"/>
      <xsd:enumeration value="rect"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PathShadeProperties">
    <xsd:sequence>
      <xsd:element name="fillToRect" type="CT_RelativeRect" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="path" type="ST_PathShadeType" use="optional"/>
  </xsd:complexType>
  <xsd:group name="EG_ShadeProperties">
    <xsd:choice>
      <xsd:element name="lin" type="CT_LinearShadeProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="path" type="CT_PathShadeProperties" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:simpleType name="ST_TileFlipMode">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="x"/>
      <xsd:enumeration value="y"/>
      <xsd:enumeration value="xy"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_GradientStop">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="pos" type="ST_PositiveFixedPercentage" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GradientStopList">
    <xsd:sequence>
      <xsd:element name="gs" type="CT_GradientStop" minOccurs="2" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_GradientFillProperties">
    <xsd:sequence>
      <xsd:element name="gsLst" type="CT_GradientStopList" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_ShadeProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tileRect" type="CT_RelativeRect" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="flip" type="ST_TileFlipMode" use="optional" default="none"/>
    <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TileInfoProperties">
    <xsd:attribute name="tx" type="ST_Coordinate" use="optional"/>
    <xsd:attribute name="ty" type="ST_Coordinate" use="optional"/>
    <xsd:attribute name="sx" type="ST_Percentage" use="optional"/>
    <xsd:attribute name="sy" type="ST_Percentage" use="optional"/>
    <xsd:attribute name="flip" type="ST_TileFlipMode" use="optional" default="none"/>
    <xsd:attribute name="algn" type="ST_RectAlignment" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_StretchInfoProperties">
    <xsd:sequence>
      <xsd:element name="fillRect" type="CT_RelativeRect" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:group name="EG_FillModeProperties">
    <xsd:choice>
      <xsd:element name="tile" type="CT_TileInfoProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="stretch" type="CT_StretchInfoProperties" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:simpleType name="ST_BlipCompression">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="email"/>
      <xsd:enumeration value="screen"/>
      <xsd:enumeration value="print"/>
      <xsd:enumeration value="hqprint"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Blip">
    <xsd:sequence>
      <xsd:choice minOccurs="0" maxOccurs="unbounded">
        <xsd:element name="alphaBiLevel" type="CT_AlphaBiLevelEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="alphaCeiling" type="CT_AlphaCeilingEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="alphaFloor" type="CT_AlphaFloorEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="alphaInv" type="CT_AlphaInverseEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="alphaMod" type="CT_AlphaModulateEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="alphaModFix" type="CT_AlphaModulateFixedEffect" minOccurs="1"
          maxOccurs="1"/>
        <xsd:element name="alphaRepl" type="CT_AlphaReplaceEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="biLevel" type="CT_BiLevelEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="blur" type="CT_BlurEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="clrChange" type="CT_ColorChangeEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="clrRepl" type="CT_ColorReplaceEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="duotone" type="CT_DuotoneEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="fillOverlay" type="CT_FillOverlayEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="grayscl" type="CT_GrayscaleEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="hsl" type="CT_HSLEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="lum" type="CT_LuminanceEffect" minOccurs="1" maxOccurs="1"/>
        <xsd:element name="tint" type="CT_TintEffect" minOccurs="1" maxOccurs="1"/>
      </xsd:choice>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_Blob"/>
    <xsd:attribute name="cstate" type="ST_BlipCompression" use="optional" default="none"/>
  </xsd:complexType>
  <xsd:complexType name="CT_BlipFillProperties">
    <xsd:sequence>
      <xsd:element name="blip" type="CT_Blip" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="srcRect" type="CT_RelativeRect" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_FillModeProperties" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="dpi" type="xsd:unsignedInt" use="optional"/>
    <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PresetPatternVal">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="pct5"/>
      <xsd:enumeration value="pct10"/>
      <xsd:enumeration value="pct20"/>
      <xsd:enumeration value="pct25"/>
      <xsd:enumeration value="pct30"/>
      <xsd:enumeration value="pct40"/>
      <xsd:enumeration value="pct50"/>
      <xsd:enumeration value="pct60"/>
      <xsd:enumeration value="pct70"/>
      <xsd:enumeration value="pct75"/>
      <xsd:enumeration value="pct80"/>
      <xsd:enumeration value="pct90"/>
      <xsd:enumeration value="horz"/>
      <xsd:enumeration value="vert"/>
      <xsd:enumeration value="ltHorz"/>
      <xsd:enumeration value="ltVert"/>
      <xsd:enumeration value="dkHorz"/>
      <xsd:enumeration value="dkVert"/>
      <xsd:enumeration value="narHorz"/>
      <xsd:enumeration value="narVert"/>
      <xsd:enumeration value="dashHorz"/>
      <xsd:enumeration value="dashVert"/>
      <xsd:enumeration value="cross"/>
      <xsd:enumeration value="dnDiag"/>
      <xsd:enumeration value="upDiag"/>
      <xsd:enumeration value="ltDnDiag"/>
      <xsd:enumeration value="ltUpDiag"/>
      <xsd:enumeration value="dkDnDiag"/>
      <xsd:enumeration value="dkUpDiag"/>
      <xsd:enumeration value="wdDnDiag"/>
      <xsd:enumeration value="wdUpDiag"/>
      <xsd:enumeration value="dashDnDiag"/>
      <xsd:enumeration value="dashUpDiag"/>
      <xsd:enumeration value="diagCross"/>
      <xsd:enumeration value="smCheck"/>
      <xsd:enumeration value="lgCheck"/>
      <xsd:enumeration value="smGrid"/>
      <xsd:enumeration value="lgGrid"/>
      <xsd:enumeration value="dotGrid"/>
      <xsd:enumeration value="smConfetti"/>
      <xsd:enumeration value="lgConfetti"/>
      <xsd:enumeration value="horzBrick"/>
      <xsd:enumeration value="diagBrick"/>
      <xsd:enumeration value="solidDmnd"/>
      <xsd:enumeration value="openDmnd"/>
      <xsd:enumeration value="dotDmnd"/>
      <xsd:enumeration value="plaid"/>
      <xsd:enumeration value="sphere"/>
      <xsd:enumeration value="weave"/>
      <xsd:enumeration value="divot"/>
      <xsd:enumeration value="shingle"/>
      <xsd:enumeration value="wave"/>
      <xsd:enumeration value="trellis"/>
      <xsd:enumeration value="zigZag"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PatternFillProperties">
    <xsd:sequence>
      <xsd:element name="fgClr" type="CT_Color" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="bgClr" type="CT_Color" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="prst" type="ST_PresetPatternVal" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GroupFillProperties"/>
  <xsd:group name="EG_FillProperties">
    <xsd:choice>
      <xsd:element name="noFill" type="CT_NoFillProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="solidFill" type="CT_SolidColorFillProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="gradFill" type="CT_GradientFillProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="blipFill" type="CT_BlipFillProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="pattFill" type="CT_PatternFillProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="grpFill" type="CT_GroupFillProperties" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_FillProperties">
    <xsd:sequence>
      <xsd:group ref="EG_FillProperties" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_FillEffect">
    <xsd:sequence>
      <xsd:group ref="EG_FillProperties" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_BlendMode">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="over"/>
      <xsd:enumeration value="mult"/>
      <xsd:enumeration value="screen"/>
      <xsd:enumeration value="darken"/>
      <xsd:enumeration value="lighten"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_FillOverlayEffect">
    <xsd:sequence>
      <xsd:group ref="EG_FillProperties" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="blend" type="ST_BlendMode" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_EffectReference">
    <xsd:attribute name="ref" type="xsd:token" use="required"/>
  </xsd:complexType>
  <xsd:group name="EG_Effect">
    <xsd:choice>
      <xsd:element name="cont" type="CT_EffectContainer" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="effect" type="CT_EffectReference" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="alphaBiLevel" type="CT_AlphaBiLevelEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="alphaCeiling" type="CT_AlphaCeilingEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="alphaFloor" type="CT_AlphaFloorEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="alphaInv" type="CT_AlphaInverseEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="alphaMod" type="CT_AlphaModulateEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="alphaModFix" type="CT_AlphaModulateFixedEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="alphaOutset" type="CT_AlphaOutsetEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="alphaRepl" type="CT_AlphaReplaceEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="biLevel" type="CT_BiLevelEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="blend" type="CT_BlendEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="blur" type="CT_BlurEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="clrChange" type="CT_ColorChangeEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="clrRepl" type="CT_ColorReplaceEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="duotone" type="CT_DuotoneEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="fill" type="CT_FillEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="fillOverlay" type="CT_FillOverlayEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="glow" type="CT_GlowEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="grayscl" type="CT_GrayscaleEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="hsl" type="CT_HSLEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="innerShdw" type="CT_InnerShadowEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="lum" type="CT_LuminanceEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="outerShdw" type="CT_OuterShadowEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="prstShdw" type="CT_PresetShadowEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="reflection" type="CT_ReflectionEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="relOff" type="CT_RelativeOffsetEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="softEdge" type="CT_SoftEdgesEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="tint" type="CT_TintEffect" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="xfrm" type="CT_TransformEffect" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:simpleType name="ST_EffectContainerType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="sib"/>
      <xsd:enumeration value="tree"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_EffectContainer">
    <xsd:group ref="EG_Effect" minOccurs="0" maxOccurs="unbounded"/>
    <xsd:attribute name="type" type="ST_EffectContainerType" use="optional" default="sib"/>
    <xsd:attribute name="name" type="xsd:token" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AlphaModulateEffect">
    <xsd:sequence>
      <xsd:element name="cont" type="CT_EffectContainer" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_BlendEffect">
    <xsd:sequence>
      <xsd:element name="cont" type="CT_EffectContainer" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="blend" type="ST_BlendMode" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_EffectList">
    <xsd:sequence>
      <xsd:element name="blur" type="CT_BlurEffect" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="fillOverlay" type="CT_FillOverlayEffect" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="glow" type="CT_GlowEffect" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="innerShdw" type="CT_InnerShadowEffect" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="outerShdw" type="CT_OuterShadowEffect" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="prstShdw" type="CT_PresetShadowEffect" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="reflection" type="CT_ReflectionEffect" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="softEdge" type="CT_SoftEdgesEffect" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:group name="EG_EffectProperties">
    <xsd:choice>
      <xsd:element name="effectLst" type="CT_EffectList" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="effectDag" type="CT_EffectContainer" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_EffectProperties">
    <xsd:sequence>
      <xsd:group ref="EG_EffectProperties" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="blip" type="CT_Blip"/>
  <xsd:simpleType name="ST_ShapeType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="line"/>
      <xsd:enumeration value="lineInv"/>
      <xsd:enumeration value="triangle"/>
      <xsd:enumeration value="rtTriangle"/>
      <xsd:enumeration value="rect"/>
      <xsd:enumeration value="diamond"/>
      <xsd:enumeration value="parallelogram"/>
      <xsd:enumeration value="trapezoid"/>
      <xsd:enumeration value="nonIsoscelesTrapezoid"/>
      <xsd:enumeration value="pentagon"/>
      <xsd:enumeration value="hexagon"/>
      <xsd:enumeration value="heptagon"/>
      <xsd:enumeration value="octagon"/>
      <xsd:enumeration value="decagon"/>
      <xsd:enumeration value="dodecagon"/>
      <xsd:enumeration value="star4"/>
      <xsd:enumeration value="star5"/>
      <xsd:enumeration value="star6"/>
      <xsd:enumeration value="star7"/>
      <xsd:enumeration value="star8"/>
      <xsd:enumeration value="star10"/>
      <xsd:enumeration value="star12"/>
      <xsd:enumeration value="star16"/>
      <xsd:enumeration value="star24"/>
      <xsd:enumeration value="star32"/>
      <xsd:enumeration value="roundRect"/>
      <xsd:enumeration value="round1Rect"/>
      <xsd:enumeration value="round2SameRect"/>
      <xsd:enumeration value="round2DiagRect"/>
      <xsd:enumeration value="snipRoundRect"/>
      <xsd:enumeration value="snip1Rect"/>
      <xsd:enumeration value="snip2SameRect"/>
      <xsd:enumeration value="snip2DiagRect"/>
      <xsd:enumeration value="plaque"/>
      <xsd:enumeration value="ellipse"/>
      <xsd:enumeration value="teardrop"/>
      <xsd:enumeration value="homePlate"/>
      <xsd:enumeration value="chevron"/>
      <xsd:enumeration value="pieWedge"/>
      <xsd:enumeration value="pie"/>
      <xsd:enumeration value="blockArc"/>
      <xsd:enumeration value="donut"/>
      <xsd:enumeration value="noSmoking"/>
      <xsd:enumeration value="rightArrow"/>
      <xsd:enumeration value="leftArrow"/>
      <xsd:enumeration value="upArrow"/>
      <xsd:enumeration value="downArrow"/>
      <xsd:enumeration value="stripedRightArrow"/>
      <xsd:enumeration value="notchedRightArrow"/>
      <xsd:enumeration value="bentUpArrow"/>
      <xsd:enumeration value="leftRightArrow"/>
      <xsd:enumeration value="upDownArrow"/>
      <xsd:enumeration value="leftUpArrow"/>
      <xsd:enumeration value="leftRightUpArrow"/>
      <xsd:enumeration value="quadArrow"/>
      <xsd:enumeration value="leftArrowCallout"/>
      <xsd:enumeration value="rightArrowCallout"/>
      <xsd:enumeration value="upArrowCallout"/>
      <xsd:enumeration value="downArrowCallout"/>
      <xsd:enumeration value="leftRightArrowCallout"/>
      <xsd:enumeration value="upDownArrowCallout"/>
      <xsd:enumeration value="quadArrowCallout"/>
      <xsd:enumeration value="bentArrow"/>
      <xsd:enumeration value="uturnArrow"/>
      <xsd:enumeration value="circularArrow"/>
      <xsd:enumeration value="leftCircularArrow"/>
      <xsd:enumeration value="leftRightCircularArrow"/>
      <xsd:enumeration value="curvedRightArrow"/>
      <xsd:enumeration value="curvedLeftArrow"/>
      <xsd:enumeration value="curvedUpArrow"/>
      <xsd:enumeration value="curvedDownArrow"/>
      <xsd:enumeration value="swooshArrow"/>
      <xsd:enumeration value="cube"/>
      <xsd:enumeration value="can"/>
      <xsd:enumeration value="lightningBolt"/>
      <xsd:enumeration value="heart"/>
      <xsd:enumeration value="sun"/>
      <xsd:enumeration value="moon"/>
      <xsd:enumeration value="smileyFace"/>
      <xsd:enumeration value="irregularSeal1"/>
      <xsd:enumeration value="irregularSeal2"/>
      <xsd:enumeration value="foldedCorner"/>
      <xsd:enumeration value="bevel"/>
      <xsd:enumeration value="frame"/>
      <xsd:enumeration value="halfFrame"/>
      <xsd:enumeration value="corner"/>
      <xsd:enumeration value="diagStripe"/>
      <xsd:enumeration value="chord"/>
      <xsd:enumeration value="arc"/>
      <xsd:enumeration value="leftBracket"/>
      <xsd:enumeration value="rightBracket"/>
      <xsd:enumeration value="leftBrace"/>
      <xsd:enumeration value="rightBrace"/>
      <xsd:enumeration value="bracketPair"/>
      <xsd:enumeration value="bracePair"/>
      <xsd:enumeration value="straightConnector1"/>
      <xsd:enumeration value="bentConnector2"/>
      <xsd:enumeration value="bentConnector3"/>
      <xsd:enumeration value="bentConnector4"/>
      <xsd:enumeration value="bentConnector5"/>
      <xsd:enumeration value="curvedConnector2"/>
      <xsd:enumeration value="curvedConnector3"/>
      <xsd:enumeration value="curvedConnector4"/>
      <xsd:enumeration value="curvedConnector5"/>
      <xsd:enumeration value="callout1"/>
      <xsd:enumeration value="callout2"/>
      <xsd:enumeration value="callout3"/>
      <xsd:enumeration value="accentCallout1"/>
      <xsd:enumeration value="accentCallout2"/>
      <xsd:enumeration value="accentCallout3"/>
      <xsd:enumeration value="borderCallout1"/>
      <xsd:enumeration value="borderCallout2"/>
      <xsd:enumeration value="borderCallout3"/>
      <xsd:enumeration value="accentBorderCallout1"/>
      <xsd:enumeration value="accentBorderCallout2"/>
      <xsd:enumeration value="accentBorderCallout3"/>
      <xsd:enumeration value="wedgeRectCallout"/>
      <xsd:enumeration value="wedgeRoundRectCallout"/>
      <xsd:enumeration value="wedgeEllipseCallout"/>
      <xsd:enumeration value="cloudCallout"/>
      <xsd:enumeration value="cloud"/>
      <xsd:enumeration value="ribbon"/>
      <xsd:enumeration value="ribbon2"/>
      <xsd:enumeration value="ellipseRibbon"/>
      <xsd:enumeration value="ellipseRibbon2"/>
      <xsd:enumeration value="leftRightRibbon"/>
      <xsd:enumeration value="verticalScroll"/>
      <xsd:enumeration value="horizontalScroll"/>
      <xsd:enumeration value="wave"/>
      <xsd:enumeration value="doubleWave"/>
      <xsd:enumeration value="plus"/>
      <xsd:enumeration value="flowChartProcess"/>
      <xsd:enumeration value="flowChartDecision"/>
      <xsd:enumeration value="flowChartInputOutput"/>
      <xsd:enumeration value="flowChartPredefinedProcess"/>
      <xsd:enumeration value="flowChartInternalStorage"/>
      <xsd:enumeration value="flowChartDocument"/>
      <xsd:enumeration value="flowChartMultidocument"/>
      <xsd:enumeration value="flowChartTerminator"/>
      <xsd:enumeration value="flowChartPreparation"/>
      <xsd:enumeration value="flowChartManualInput"/>
      <xsd:enumeration value="flowChartManualOperation"/>
      <xsd:enumeration value="flowChartConnector"/>
      <xsd:enumeration value="flowChartPunchedCard"/>
      <xsd:enumeration value="flowChartPunchedTape"/>
      <xsd:enumeration value="flowChartSummingJunction"/>
      <xsd:enumeration value="flowChartOr"/>
      <xsd:enumeration value="flowChartCollate"/>
      <xsd:enumeration value="flowChartSort"/>
      <xsd:enumeration value="flowChartExtract"/>
      <xsd:enumeration value="flowChartMerge"/>
      <xsd:enumeration value="flowChartOfflineStorage"/>
      <xsd:enumeration value="flowChartOnlineStorage"/>
      <xsd:enumeration value="flowChartMagneticTape"/>
      <xsd:enumeration value="flowChartMagneticDisk"/>
      <xsd:enumeration value="flowChartMagneticDrum"/>
      <xsd:enumeration value="flowChartDisplay"/>
      <xsd:enumeration value="flowChartDelay"/>
      <xsd:enumeration value="flowChartAlternateProcess"/>
      <xsd:enumeration value="flowChartOffpageConnector"/>
      <xsd:enumeration value="actionButtonBlank"/>
      <xsd:enumeration value="actionButtonHome"/>
      <xsd:enumeration value="actionButtonHelp"/>
      <xsd:enumeration value="actionButtonInformation"/>
      <xsd:enumeration value="actionButtonForwardNext"/>
      <xsd:enumeration value="actionButtonBackPrevious"/>
      <xsd:enumeration value="actionButtonEnd"/>
      <xsd:enumeration value="actionButtonBeginning"/>
      <xsd:enumeration value="actionButtonReturn"/>
      <xsd:enumeration value="actionButtonDocument"/>
      <xsd:enumeration value="actionButtonSound"/>
      <xsd:enumeration value="actionButtonMovie"/>
      <xsd:enumeration value="gear6"/>
      <xsd:enumeration value="gear9"/>
      <xsd:enumeration value="funnel"/>
      <xsd:enumeration value="mathPlus"/>
      <xsd:enumeration value="mathMinus"/>
      <xsd:enumeration value="mathMultiply"/>
      <xsd:enumeration value="mathDivide"/>
      <xsd:enumeration value="mathEqual"/>
      <xsd:enumeration value="mathNotEqual"/>
      <xsd:enumeration value="cornerTabs"/>
      <xsd:enumeration value="squareTabs"/>
      <xsd:enumeration value="plaqueTabs"/>
      <xsd:enumeration value="chartX"/>
      <xsd:enumeration value="chartStar"/>
      <xsd:enumeration value="chartPlus"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextShapeType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="textNoShape"/>
      <xsd:enumeration value="textPlain"/>
      <xsd:enumeration value="textStop"/>
      <xsd:enumeration value="textTriangle"/>
      <xsd:enumeration value="textTriangleInverted"/>
      <xsd:enumeration value="textChevron"/>
      <xsd:enumeration value="textChevronInverted"/>
      <xsd:enumeration value="textRingInside"/>
      <xsd:enumeration value="textRingOutside"/>
      <xsd:enumeration value="textArchUp"/>
      <xsd:enumeration value="textArchDown"/>
      <xsd:enumeration value="textCircle"/>
      <xsd:enumeration value="textButton"/>
      <xsd:enumeration value="textArchUpPour"/>
      <xsd:enumeration value="textArchDownPour"/>
      <xsd:enumeration value="textCirclePour"/>
      <xsd:enumeration value="textButtonPour"/>
      <xsd:enumeration value="textCurveUp"/>
      <xsd:enumeration value="textCurveDown"/>
      <xsd:enumeration value="textCanUp"/>
      <xsd:enumeration value="textCanDown"/>
      <xsd:enumeration value="textWave1"/>
      <xsd:enumeration value="textWave2"/>
      <xsd:enumeration value="textDoubleWave1"/>
      <xsd:enumeration value="textWave4"/>
      <xsd:enumeration value="textInflate"/>
      <xsd:enumeration value="textDeflate"/>
      <xsd:enumeration value="textInflateBottom"/>
      <xsd:enumeration value="textDeflateBottom"/>
      <xsd:enumeration value="textInflateTop"/>
      <xsd:enumeration value="textDeflateTop"/>
      <xsd:enumeration value="textDeflateInflate"/>
      <xsd:enumeration value="textDeflateInflateDeflate"/>
      <xsd:enumeration value="textFadeRight"/>
      <xsd:enumeration value="textFadeLeft"/>
      <xsd:enumeration value="textFadeUp"/>
      <xsd:enumeration value="textFadeDown"/>
      <xsd:enumeration value="textSlantUp"/>
      <xsd:enumeration value="textSlantDown"/>
      <xsd:enumeration value="textCascadeUp"/>
      <xsd:enumeration value="textCascadeDown"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_GeomGuideName">
    <xsd:restriction base="xsd:token"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_GeomGuideFormula">
    <xsd:restriction base="xsd:string"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_GeomGuide">
    <xsd:attribute name="name" type="ST_GeomGuideName" use="required"/>
    <xsd:attribute name="fmla" type="ST_GeomGuideFormula" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GeomGuideList">
    <xsd:sequence>
      <xsd:element name="gd" type="CT_GeomGuide" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_AdjCoordinate">
    <xsd:union memberTypes="ST_Coordinate ST_GeomGuideName"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_AdjAngle">
    <xsd:union memberTypes="ST_Angle ST_GeomGuideName"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_AdjPoint2D">
    <xsd:attribute name="x" type="ST_AdjCoordinate" use="required"/>
    <xsd:attribute name="y" type="ST_AdjCoordinate" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GeomRect">
    <xsd:attribute name="l" type="ST_AdjCoordinate" use="required"/>
    <xsd:attribute name="t" type="ST_AdjCoordinate" use="required"/>
    <xsd:attribute name="r" type="ST_AdjCoordinate" use="required"/>
    <xsd:attribute name="b" type="ST_AdjCoordinate" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_XYAdjustHandle">
    <xsd:sequence>
      <xsd:element name="pos" type="CT_AdjPoint2D" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="gdRefX" type="ST_GeomGuideName" use="optional"/>
    <xsd:attribute name="minX" type="ST_AdjCoordinate" use="optional"/>
    <xsd:attribute name="maxX" type="ST_AdjCoordinate" use="optional"/>
    <xsd:attribute name="gdRefY" type="ST_GeomGuideName" use="optional"/>
    <xsd:attribute name="minY" type="ST_AdjCoordinate" use="optional"/>
    <xsd:attribute name="maxY" type="ST_AdjCoordinate" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PolarAdjustHandle">
    <xsd:sequence>
      <xsd:element name="pos" type="CT_AdjPoint2D" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="gdRefR" type="ST_GeomGuideName" use="optional"/>
    <xsd:attribute name="minR" type="ST_AdjCoordinate" use="optional"/>
    <xsd:attribute name="maxR" type="ST_AdjCoordinate" use="optional"/>
    <xsd:attribute name="gdRefAng" type="ST_GeomGuideName" use="optional"/>
    <xsd:attribute name="minAng" type="ST_AdjAngle" use="optional"/>
    <xsd:attribute name="maxAng" type="ST_AdjAngle" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ConnectionSite">
    <xsd:sequence>
      <xsd:element name="pos" type="CT_AdjPoint2D" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="ang" type="ST_AdjAngle" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AdjustHandleList">
    <xsd:choice minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="ahXY" type="CT_XYAdjustHandle" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="ahPolar" type="CT_PolarAdjustHandle" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:complexType name="CT_ConnectionSiteList">
    <xsd:sequence>
      <xsd:element name="cxn" type="CT_ConnectionSite" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Connection">
    <xsd:attribute name="id" type="ST_DrawingElementId" use="required"/>
    <xsd:attribute name="idx" type="xsd:unsignedInt" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Path2DMoveTo">
    <xsd:sequence>
      <xsd:element name="pt" type="CT_AdjPoint2D" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Path2DLineTo">
    <xsd:sequence>
      <xsd:element name="pt" type="CT_AdjPoint2D" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Path2DArcTo">
    <xsd:attribute name="wR" type="ST_AdjCoordinate" use="required"/>
    <xsd:attribute name="hR" type="ST_AdjCoordinate" use="required"/>
    <xsd:attribute name="stAng" type="ST_AdjAngle" use="required"/>
    <xsd:attribute name="swAng" type="ST_AdjAngle" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Path2DQuadBezierTo">
    <xsd:sequence>
      <xsd:element name="pt" type="CT_AdjPoint2D" minOccurs="2" maxOccurs="2"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Path2DCubicBezierTo">
    <xsd:sequence>
      <xsd:element name="pt" type="CT_AdjPoint2D" minOccurs="3" maxOccurs="3"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Path2DClose"/>
  <xsd:simpleType name="ST_PathFillMode">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="norm"/>
      <xsd:enumeration value="lighten"/>
      <xsd:enumeration value="lightenLess"/>
      <xsd:enumeration value="darken"/>
      <xsd:enumeration value="darkenLess"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Path2D">
    <xsd:choice minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="close" type="CT_Path2DClose" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="moveTo" type="CT_Path2DMoveTo" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="lnTo" type="CT_Path2DLineTo" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="arcTo" type="CT_Path2DArcTo" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="quadBezTo" type="CT_Path2DQuadBezierTo" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="cubicBezTo" type="CT_Path2DCubicBezierTo" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
    <xsd:attribute name="w" type="ST_PositiveCoordinate" use="optional" default="0"/>
    <xsd:attribute name="h" type="ST_PositiveCoordinate" use="optional" default="0"/>
    <xsd:attribute name="fill" type="ST_PathFillMode" use="optional" default="norm"/>
    <xsd:attribute name="stroke" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="extrusionOk" type="xsd:boolean" use="optional" default="true"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Path2DList">
    <xsd:sequence>
      <xsd:element name="path" type="CT_Path2D" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_PresetGeometry2D">
    <xsd:sequence>
      <xsd:element name="avLst" type="CT_GeomGuideList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="prst" type="ST_ShapeType" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PresetTextShape">
    <xsd:sequence>
      <xsd:element name="avLst" type="CT_GeomGuideList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="prst" type="ST_TextShapeType" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomGeometry2D">
    <xsd:sequence>
      <xsd:element name="avLst" type="CT_GeomGuideList" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="gdLst" type="CT_GeomGuideList" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="ahLst" type="CT_AdjustHandleList" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="cxnLst" type="CT_ConnectionSiteList" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="rect" type="CT_GeomRect" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="pathLst" type="CT_Path2DList" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:group name="EG_Geometry">
    <xsd:choice>
      <xsd:element name="custGeom" type="CT_CustomGeometry2D" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="prstGeom" type="CT_PresetGeometry2D" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:group name="EG_TextGeometry">
    <xsd:choice>
      <xsd:element name="custGeom" type="CT_CustomGeometry2D" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="prstTxWarp" type="CT_PresetTextShape" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:simpleType name="ST_LineEndType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="triangle"/>
      <xsd:enumeration value="stealth"/>
      <xsd:enumeration value="diamond"/>
      <xsd:enumeration value="oval"/>
      <xsd:enumeration value="arrow"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_LineEndWidth">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="sm"/>
      <xsd:enumeration value="med"/>
      <xsd:enumeration value="lg"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_LineEndLength">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="sm"/>
      <xsd:enumeration value="med"/>
      <xsd:enumeration value="lg"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_LineEndProperties">
    <xsd:attribute name="type" type="ST_LineEndType" use="optional" default="none"/>
    <xsd:attribute name="w" type="ST_LineEndWidth" use="optional"/>
    <xsd:attribute name="len" type="ST_LineEndLength" use="optional"/>
  </xsd:complexType>
  <xsd:group name="EG_LineFillProperties">
    <xsd:choice>
      <xsd:element name="noFill" type="CT_NoFillProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="solidFill" type="CT_SolidColorFillProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="gradFill" type="CT_GradientFillProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="pattFill" type="CT_PatternFillProperties" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_LineJoinBevel"/>
  <xsd:complexType name="CT_LineJoinRound"/>
  <xsd:complexType name="CT_LineJoinMiterProperties">
    <xsd:attribute name="lim" type="ST_PositivePercentage" use="optional"/>
  </xsd:complexType>
  <xsd:group name="EG_LineJoinProperties">
    <xsd:choice>
      <xsd:element name="round" type="CT_LineJoinRound" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="bevel" type="CT_LineJoinBevel" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="miter" type="CT_LineJoinMiterProperties" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:simpleType name="ST_PresetLineDashVal">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="solid"/>
      <xsd:enumeration value="dot"/>
      <xsd:enumeration value="dash"/>
      <xsd:enumeration value="lgDash"/>
      <xsd:enumeration value="dashDot"/>
      <xsd:enumeration value="lgDashDot"/>
      <xsd:enumeration value="lgDashDotDot"/>
      <xsd:enumeration value="sysDash"/>
      <xsd:enumeration value="sysDot"/>
      <xsd:enumeration value="sysDashDot"/>
      <xsd:enumeration value="sysDashDotDot"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PresetLineDashProperties">
    <xsd:attribute name="val" type="ST_PresetLineDashVal" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DashStop">
    <xsd:attribute name="d" type="ST_PositivePercentage" use="required"/>
    <xsd:attribute name="sp" type="ST_PositivePercentage" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DashStopList">
    <xsd:sequence>
      <xsd:element name="ds" type="CT_DashStop" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:group name="EG_LineDashProperties">
    <xsd:choice>
      <xsd:element name="prstDash" type="CT_PresetLineDashProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="custDash" type="CT_DashStopList" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:simpleType name="ST_LineCap">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="rnd"/>
      <xsd:enumeration value="sq"/>
      <xsd:enumeration value="flat"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_LineWidth">
    <xsd:restriction base="ST_Coordinate32Unqualified">
      <xsd:minInclusive value="0"/>
      <xsd:maxInclusive value="20116800"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PenAlignment">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="ctr"/>
      <xsd:enumeration value="in"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_CompoundLine">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="sng"/>
      <xsd:enumeration value="dbl"/>
      <xsd:enumeration value="thickThin"/>
      <xsd:enumeration value="thinThick"/>
      <xsd:enumeration value="tri"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_LineProperties">
    <xsd:sequence>
      <xsd:group ref="EG_LineFillProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_LineDashProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_LineJoinProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="headEnd" type="CT_LineEndProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tailEnd" type="CT_LineEndProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="w" type="ST_LineWidth" use="optional"/>
    <xsd:attribute name="cap" type="ST_LineCap" use="optional"/>
    <xsd:attribute name="cmpd" type="ST_CompoundLine" use="optional"/>
    <xsd:attribute name="algn" type="ST_PenAlignment" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_ShapeID">
    <xsd:restriction base="xsd:token"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_ShapeProperties">
    <xsd:sequence>
      <xsd:element name="xfrm" type="CT_Transform2D" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_Geometry" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_FillProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="ln" type="CT_LineProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_EffectProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="scene3d" type="CT_Scene3D" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sp3d" type="CT_Shape3D" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="bwMode" type="ST_BlackWhiteMode" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_GroupShapeProperties">
    <xsd:sequence>
      <xsd:element name="xfrm" type="CT_GroupTransform2D" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_FillProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_EffectProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="scene3d" type="CT_Scene3D" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="bwMode" type="ST_BlackWhiteMode" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_StyleMatrixReference">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="idx" type="ST_StyleMatrixColumnIndex" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FontReference">
    <xsd:sequence>
      <xsd:group ref="EG_ColorChoice" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="idx" type="ST_FontCollectionIndex" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ShapeStyle">
    <xsd:sequence>
      <xsd:element name="lnRef" type="CT_StyleMatrixReference" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="fillRef" type="CT_StyleMatrixReference" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="effectRef" type="CT_StyleMatrixReference" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="fontRef" type="CT_FontReference" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_DefaultShapeDefinition">
    <xsd:sequence>
      <xsd:element name="spPr" type="CT_ShapeProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="bodyPr" type="CT_TextBodyProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="lstStyle" type="CT_TextListStyle" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="style" type="CT_ShapeStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ObjectStyleDefaults">
    <xsd:sequence>
      <xsd:element name="spDef" type="CT_DefaultShapeDefinition" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lnDef" type="CT_DefaultShapeDefinition" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="txDef" type="CT_DefaultShapeDefinition" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_EmptyElement"/>
  <xsd:complexType name="CT_ColorMapping">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="bg1" type="ST_ColorSchemeIndex" use="required"/>
    <xsd:attribute name="tx1" type="ST_ColorSchemeIndex" use="required"/>
    <xsd:attribute name="bg2" type="ST_ColorSchemeIndex" use="required"/>
    <xsd:attribute name="tx2" type="ST_ColorSchemeIndex" use="required"/>
    <xsd:attribute name="accent1" type="ST_ColorSchemeIndex" use="required"/>
    <xsd:attribute name="accent2" type="ST_ColorSchemeIndex" use="required"/>
    <xsd:attribute name="accent3" type="ST_ColorSchemeIndex" use="required"/>
    <xsd:attribute name="accent4" type="ST_ColorSchemeIndex" use="required"/>
    <xsd:attribute name="accent5" type="ST_ColorSchemeIndex" use="required"/>
    <xsd:attribute name="accent6" type="ST_ColorSchemeIndex" use="required"/>
    <xsd:attribute name="hlink" type="ST_ColorSchemeIndex" use="required"/>
    <xsd:attribute name="folHlink" type="ST_ColorSchemeIndex" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ColorMappingOverride">
    <xsd:sequence>
      <xsd:choice minOccurs="1" maxOccurs="1">
        <xsd:element name="masterClrMapping" type="CT_EmptyElement"/>
        <xsd:element name="overrideClrMapping" type="CT_ColorMapping"/>
      </xsd:choice>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ColorSchemeAndMapping">
    <xsd:sequence>
      <xsd:element name="clrScheme" type="CT_ColorScheme" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="clrMap" type="CT_ColorMapping" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ColorSchemeList">
    <xsd:sequence>
      <xsd:element name="extraClrScheme" type="CT_ColorSchemeAndMapping" minOccurs="0"
        maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_OfficeStyleSheet">
    <xsd:sequence>
      <xsd:element name="themeElements" type="CT_BaseStyles" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="objectDefaults" type="CT_ObjectStyleDefaults" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extraClrSchemeLst" type="CT_ColorSchemeList" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="custClrLst" type="CT_CustomColorList" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="xsd:string" use="optional" default=""/>
  </xsd:complexType>
  <xsd:complexType name="CT_BaseStylesOverride">
    <xsd:sequence>
      <xsd:element name="clrScheme" type="CT_ColorScheme" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="fontScheme" type="CT_FontScheme" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="fmtScheme" type="CT_StyleMatrix" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ClipboardStyleSheet">
    <xsd:sequence>
      <xsd:element name="themeElements" type="CT_BaseStyles" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="clrMap" type="CT_ColorMapping" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="theme" type="CT_OfficeStyleSheet"/>
  <xsd:element name="themeOverride" type="CT_BaseStylesOverride"/>
  <xsd:element name="themeManager" type="CT_EmptyElement"/>
  <xsd:complexType name="CT_TableCellProperties">
    <xsd:sequence>
      <xsd:element name="lnL" type="CT_LineProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lnR" type="CT_LineProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lnT" type="CT_LineProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lnB" type="CT_LineProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lnTlToBr" type="CT_LineProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lnBlToTr" type="CT_LineProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="cell3D" type="CT_Cell3D" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_FillProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="headers" type="CT_Headers" minOccurs="0"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="marL" type="ST_Coordinate32" use="optional" default="91440"/>
    <xsd:attribute name="marR" type="ST_Coordinate32" use="optional" default="91440"/>
    <xsd:attribute name="marT" type="ST_Coordinate32" use="optional" default="45720"/>
    <xsd:attribute name="marB" type="ST_Coordinate32" use="optional" default="45720"/>
    <xsd:attribute name="vert" type="ST_TextVerticalType" use="optional" default="horz"/>
    <xsd:attribute name="anchor" type="ST_TextAnchoringType" use="optional" default="t"/>
    <xsd:attribute name="anchorCtr" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="horzOverflow" type="ST_TextHorzOverflowType" use="optional" default="clip"
    />
  </xsd:complexType>
  <xsd:complexType name="CT_Headers">
    <xsd:sequence minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="header" type="xsd:string"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TableCol">
    <xsd:sequence>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="w" type="ST_Coordinate" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TableGrid">
    <xsd:sequence>
      <xsd:element name="gridCol" type="CT_TableCol" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TableCell">
    <xsd:sequence>
      <xsd:element name="txBody" type="CT_TextBody" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tcPr" type="CT_TableCellProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="rowSpan" type="xsd:int" use="optional" default="1"/>
    <xsd:attribute name="gridSpan" type="xsd:int" use="optional" default="1"/>
    <xsd:attribute name="hMerge" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="vMerge" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="id" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TableRow">
    <xsd:sequence>
      <xsd:element name="tc" type="CT_TableCell" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="h" type="ST_Coordinate" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TableProperties">
    <xsd:sequence>
      <xsd:group ref="EG_FillProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_EffectProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:choice minOccurs="0" maxOccurs="1">
        <xsd:element name="tableStyle" type="CT_TableStyle"/>
        <xsd:element name="tableStyleId" type="s:ST_Guid"/>
      </xsd:choice>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="rtl" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="firstRow" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="firstCol" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="lastRow" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="lastCol" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="bandRow" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="bandCol" type="xsd:boolean" use="optional" default="false"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Table">
    <xsd:sequence>
      <xsd:element name="tblPr" type="CT_TableProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblGrid" type="CT_TableGrid" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="tr" type="CT_TableRow" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="tbl" type="CT_Table"/>
  <xsd:complexType name="CT_Cell3D">
    <xsd:sequence>
      <xsd:element name="bevel" type="CT_Bevel" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="lightRig" type="CT_LightRig" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="prstMaterial" type="ST_PresetMaterialType" use="optional" default="plastic"
    />
  </xsd:complexType>
  <xsd:group name="EG_ThemeableFillStyle">
    <xsd:choice>
      <xsd:element name="fill" type="CT_FillProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="fillRef" type="CT_StyleMatrixReference" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_ThemeableLineStyle">
    <xsd:choice>
      <xsd:element name="ln" type="CT_LineProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="lnRef" type="CT_StyleMatrixReference" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:group name="EG_ThemeableEffectStyle">
    <xsd:choice>
      <xsd:element name="effect" type="CT_EffectProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="effectRef" type="CT_StyleMatrixReference" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:group name="EG_ThemeableFontStyles">
    <xsd:choice>
      <xsd:element name="font" type="CT_FontCollection" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="fontRef" type="CT_FontReference" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:simpleType name="ST_OnOffStyleType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="on"/>
      <xsd:enumeration value="off"/>
      <xsd:enumeration value="def"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TableStyleTextStyle">
    <xsd:sequence>
      <xsd:group ref="EG_ThemeableFontStyles" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_ColorChoice" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="b" type="ST_OnOffStyleType" use="optional" default="def"/>
    <xsd:attribute name="i" type="ST_OnOffStyleType" use="optional" default="def"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TableCellBorderStyle">
    <xsd:sequence>
      <xsd:element name="left" type="CT_ThemeableLineStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="right" type="CT_ThemeableLineStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="top" type="CT_ThemeableLineStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="bottom" type="CT_ThemeableLineStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="insideH" type="CT_ThemeableLineStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="insideV" type="CT_ThemeableLineStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tl2br" type="CT_ThemeableLineStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tr2bl" type="CT_ThemeableLineStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TableBackgroundStyle">
    <xsd:sequence>
      <xsd:group ref="EG_ThemeableFillStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_ThemeableEffectStyle" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TableStyleCellStyle">
    <xsd:sequence>
      <xsd:element name="tcBdr" type="CT_TableCellBorderStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_ThemeableFillStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="cell3D" type="CT_Cell3D" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TablePartStyle">
    <xsd:sequence>
      <xsd:element name="tcTxStyle" type="CT_TableStyleTextStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tcStyle" type="CT_TableStyleCellStyle" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TableStyle">
    <xsd:sequence>
      <xsd:element name="tblBg" type="CT_TableBackgroundStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="wholeTbl" type="CT_TablePartStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="band1H" type="CT_TablePartStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="band2H" type="CT_TablePartStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="band1V" type="CT_TablePartStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="band2V" type="CT_TablePartStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lastCol" type="CT_TablePartStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="firstCol" type="CT_TablePartStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lastRow" type="CT_TablePartStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="seCell" type="CT_TablePartStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="swCell" type="CT_TablePartStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="firstRow" type="CT_TablePartStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="neCell" type="CT_TablePartStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="nwCell" type="CT_TablePartStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="styleId" type="s:ST_Guid" use="required"/>
    <xsd:attribute name="styleName" type="xsd:string" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TableStyleList">
    <xsd:sequence>
      <xsd:element name="tblStyle" type="CT_TableStyle" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="def" type="s:ST_Guid" use="required"/>
  </xsd:complexType>
  <xsd:element name="tblStyleLst" type="CT_TableStyleList"/>
  <xsd:complexType name="CT_TextParagraph">
    <xsd:sequence>
      <xsd:element name="pPr" type="CT_TextParagraphProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_TextRun" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="endParaRPr" type="CT_TextCharacterProperties" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextAnchoringType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="t"/>
      <xsd:enumeration value="ctr"/>
      <xsd:enumeration value="b"/>
      <xsd:enumeration value="just"/>
      <xsd:enumeration value="dist"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextVertOverflowType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="overflow"/>
      <xsd:enumeration value="ellipsis"/>
      <xsd:enumeration value="clip"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextHorzOverflowType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="overflow"/>
      <xsd:enumeration value="clip"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextVerticalType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="horz"/>
      <xsd:enumeration value="vert"/>
      <xsd:enumeration value="vert270"/>
      <xsd:enumeration value="wordArtVert"/>
      <xsd:enumeration value="eaVert"/>
      <xsd:enumeration value="mongolianVert"/>
      <xsd:enumeration value="wordArtVertRtl"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextWrappingType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="square"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextColumnCount">
    <xsd:restriction base="xsd:int">
      <xsd:minInclusive value="1"/>
      <xsd:maxInclusive value="16"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextListStyle">
    <xsd:sequence>
      <xsd:element name="defPPr" type="CT_TextParagraphProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lvl1pPr" type="CT_TextParagraphProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lvl2pPr" type="CT_TextParagraphProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lvl3pPr" type="CT_TextParagraphProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lvl4pPr" type="CT_TextParagraphProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lvl5pPr" type="CT_TextParagraphProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lvl6pPr" type="CT_TextParagraphProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lvl7pPr" type="CT_TextParagraphProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lvl8pPr" type="CT_TextParagraphProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="lvl9pPr" type="CT_TextParagraphProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextFontScalePercentOrPercentString">
    <xsd:union memberTypes="ST_TextFontScalePercent s:ST_Percentage"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextFontScalePercent">
    <xsd:restriction base="ST_PercentageDecimal">
      <xsd:minInclusive value="1000"/>
      <xsd:maxInclusive value="100000"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextNormalAutofit">
    <xsd:attribute name="fontScale" type="ST_TextFontScalePercentOrPercentString" use="optional"
      default="100%"/>
    <xsd:attribute name="lnSpcReduction" type="ST_TextSpacingPercentOrPercentString" use="optional"
      default="0%"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TextShapeAutofit"/>
  <xsd:complexType name="CT_TextNoAutofit"/>
  <xsd:group name="EG_TextAutofit">
    <xsd:choice>
      <xsd:element name="noAutofit" type="CT_TextNoAutofit"/>
      <xsd:element name="normAutofit" type="CT_TextNormalAutofit"/>
      <xsd:element name="spAutoFit" type="CT_TextShapeAutofit"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_TextBodyProperties">
    <xsd:sequence>
      <xsd:element name="prstTxWarp" type="CT_PresetTextShape" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_TextAutofit" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="scene3d" type="CT_Scene3D" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_Text3D" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="rot" type="ST_Angle" use="optional"/>
    <xsd:attribute name="spcFirstLastPara" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="vertOverflow" type="ST_TextVertOverflowType" use="optional"/>
    <xsd:attribute name="horzOverflow" type="ST_TextHorzOverflowType" use="optional"/>
    <xsd:attribute name="vert" type="ST_TextVerticalType" use="optional"/>
    <xsd:attribute name="wrap" type="ST_TextWrappingType" use="optional"/>
    <xsd:attribute name="lIns" type="ST_Coordinate32" use="optional"/>
    <xsd:attribute name="tIns" type="ST_Coordinate32" use="optional"/>
    <xsd:attribute name="rIns" type="ST_Coordinate32" use="optional"/>
    <xsd:attribute name="bIns" type="ST_Coordinate32" use="optional"/>
    <xsd:attribute name="numCol" type="ST_TextColumnCount" use="optional"/>
    <xsd:attribute name="spcCol" type="ST_PositiveCoordinate32" use="optional"/>
    <xsd:attribute name="rtlCol" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="fromWordArt" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="anchor" type="ST_TextAnchoringType" use="optional"/>
    <xsd:attribute name="anchorCtr" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="forceAA" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="upright" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="compatLnSpc" type="xsd:boolean" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TextBody">
    <xsd:sequence>
      <xsd:element name="bodyPr" type="CT_TextBodyProperties" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="lstStyle" type="CT_TextListStyle" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="p" type="CT_TextParagraph" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextBulletStartAtNum">
    <xsd:restriction base="xsd:int">
      <xsd:minInclusive value="1"/>
      <xsd:maxInclusive value="32767"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextAutonumberScheme">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="alphaLcParenBoth"/>
      <xsd:enumeration value="alphaUcParenBoth"/>
      <xsd:enumeration value="alphaLcParenR"/>
      <xsd:enumeration value="alphaUcParenR"/>
      <xsd:enumeration value="alphaLcPeriod"/>
      <xsd:enumeration value="alphaUcPeriod"/>
      <xsd:enumeration value="arabicParenBoth"/>
      <xsd:enumeration value="arabicParenR"/>
      <xsd:enumeration value="arabicPeriod"/>
      <xsd:enumeration value="arabicPlain"/>
      <xsd:enumeration value="romanLcParenBoth"/>
      <xsd:enumeration value="romanUcParenBoth"/>
      <xsd:enumeration value="romanLcParenR"/>
      <xsd:enumeration value="romanUcParenR"/>
      <xsd:enumeration value="romanLcPeriod"/>
      <xsd:enumeration value="romanUcPeriod"/>
      <xsd:enumeration value="circleNumDbPlain"/>
      <xsd:enumeration value="circleNumWdBlackPlain"/>
      <xsd:enumeration value="circleNumWdWhitePlain"/>
      <xsd:enumeration value="arabicDbPeriod"/>
      <xsd:enumeration value="arabicDbPlain"/>
      <xsd:enumeration value="ea1ChsPeriod"/>
      <xsd:enumeration value="ea1ChsPlain"/>
      <xsd:enumeration value="ea1ChtPeriod"/>
      <xsd:enumeration value="ea1ChtPlain"/>
      <xsd:enumeration value="ea1JpnChsDbPeriod"/>
      <xsd:enumeration value="ea1JpnKorPlain"/>
      <xsd:enumeration value="ea1JpnKorPeriod"/>
      <xsd:enumeration value="arabic1Minus"/>
      <xsd:enumeration value="arabic2Minus"/>
      <xsd:enumeration value="hebrew2Minus"/>
      <xsd:enumeration value="thaiAlphaPeriod"/>
      <xsd:enumeration value="thaiAlphaParenR"/>
      <xsd:enumeration value="thaiAlphaParenBoth"/>
      <xsd:enumeration value="thaiNumPeriod"/>
      <xsd:enumeration value="thaiNumParenR"/>
      <xsd:enumeration value="thaiNumParenBoth"/>
      <xsd:enumeration value="hindiAlphaPeriod"/>
      <xsd:enumeration value="hindiNumPeriod"/>
      <xsd:enumeration value="hindiNumParenR"/>
      <xsd:enumeration value="hindiAlpha1Period"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextBulletColorFollowText"/>
  <xsd:group name="EG_TextBulletColor">
    <xsd:choice>
      <xsd:element name="buClrTx" type="CT_TextBulletColorFollowText" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="buClr" type="CT_Color" minOccurs="1" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:simpleType name="ST_TextBulletSize">
    <xsd:union memberTypes="ST_TextBulletSizePercent ST_TextBulletSizeDecimal"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextBulletSizePercent">
    <xsd:restriction base="xsd:string">
      <xsd:pattern value="0*((2[5-9])|([3-9][0-9])|([1-3][0-9][0-9])|400)%"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextBulletSizeDecimal">
    <xsd:restriction base="ST_PercentageDecimal">
      <xsd:minInclusive value="25000"/>
      <xsd:maxInclusive value="400000"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextBulletSizeFollowText"/>
  <xsd:complexType name="CT_TextBulletSizePercent">
    <xsd:attribute name="val" type="ST_TextBulletSizePercent" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TextBulletSizePoint">
    <xsd:attribute name="val" type="ST_TextFontSize" use="required"/>
  </xsd:complexType>
  <xsd:group name="EG_TextBulletSize">
    <xsd:choice>
      <xsd:element name="buSzTx" type="CT_TextBulletSizeFollowText"/>
      <xsd:element name="buSzPct" type="CT_TextBulletSizePercent"/>
      <xsd:element name="buSzPts" type="CT_TextBulletSizePoint"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_TextBulletTypefaceFollowText"/>
  <xsd:group name="EG_TextBulletTypeface">
    <xsd:choice>
      <xsd:element name="buFontTx" type="CT_TextBulletTypefaceFollowText"/>
      <xsd:element name="buFont" type="CT_TextFont"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_TextAutonumberBullet">
    <xsd:attribute name="type" type="ST_TextAutonumberScheme" use="required"/>
    <xsd:attribute name="startAt" type="ST_TextBulletStartAtNum" use="optional" default="1"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TextCharBullet">
    <xsd:attribute name="char" type="xsd:string" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TextBlipBullet">
    <xsd:sequence>
      <xsd:element name="blip" type="CT_Blip" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TextNoBullet"/>
  <xsd:group name="EG_TextBullet">
    <xsd:choice>
      <xsd:element name="buNone" type="CT_TextNoBullet"/>
      <xsd:element name="buAutoNum" type="CT_TextAutonumberBullet"/>
      <xsd:element name="buChar" type="CT_TextCharBullet"/>
      <xsd:element name="buBlip" type="CT_TextBlipBullet"/>
    </xsd:choice>
  </xsd:group>
  <xsd:simpleType name="ST_TextPoint">
    <xsd:union memberTypes="ST_TextPointUnqualified s:ST_UniversalMeasure"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextPointUnqualified">
    <xsd:restriction base="xsd:int">
      <xsd:minInclusive value="-400000"/>
      <xsd:maxInclusive value="400000"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextNonNegativePoint">
    <xsd:restriction base="xsd:int">
      <xsd:minInclusive value="0"/>
      <xsd:maxInclusive value="400000"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextFontSize">
    <xsd:restriction base="xsd:int">
      <xsd:minInclusive value="100"/>
      <xsd:maxInclusive value="400000"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextTypeface">
    <xsd:restriction base="xsd:string"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PitchFamily">
   <xsd:restriction base="xsd:byte">
     <xsd:enumeration value="00"/>
     <xsd:enumeration value="01"/>
     <xsd:enumeration value="02"/>
     <xsd:enumeration value="16"/>
     <xsd:enumeration value="17"/>
     <xsd:enumeration value="18"/>
     <xsd:enumeration value="32"/>
     <xsd:enumeration value="33"/>
     <xsd:enumeration value="34"/>
     <xsd:enumeration value="48"/>
     <xsd:enumeration value="49"/>
     <xsd:enumeration value="50"/>
     <xsd:enumeration value="64"/>
     <xsd:enumeration value="65"/>
     <xsd:enumeration value="66"/>
     <xsd:enumeration value="80"/>
     <xsd:enumeration value="81"/>
     <xsd:enumeration value="82"/>
   </xsd:restriction>
   </xsd:simpleType>
   <xsd:complexType name="CT_TextFont">
    <xsd:attribute name="typeface" type="ST_TextTypeface" use="required"/>
    <xsd:attribute name="panose" type="s:ST_Panose" use="optional"/>
    <xsd:attribute name="pitchFamily" type="ST_PitchFamily" use="optional" default="0"/>
    <xsd:attribute name="charset" type="xsd:byte" use="optional" default="1"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextUnderlineType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="words"/>
      <xsd:enumeration value="sng"/>
      <xsd:enumeration value="dbl"/>
      <xsd:enumeration value="heavy"/>
      <xsd:enumeration value="dotted"/>
      <xsd:enumeration value="dottedHeavy"/>
      <xsd:enumeration value="dash"/>
      <xsd:enumeration value="dashHeavy"/>
      <xsd:enumeration value="dashLong"/>
      <xsd:enumeration value="dashLongHeavy"/>
      <xsd:enumeration value="dotDash"/>
      <xsd:enumeration value="dotDashHeavy"/>
      <xsd:enumeration value="dotDotDash"/>
      <xsd:enumeration value="dotDotDashHeavy"/>
      <xsd:enumeration value="wavy"/>
      <xsd:enumeration value="wavyHeavy"/>
      <xsd:enumeration value="wavyDbl"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextUnderlineLineFollowText"/>
  <xsd:complexType name="CT_TextUnderlineFillFollowText"/>
  <xsd:complexType name="CT_TextUnderlineFillGroupWrapper">
    <xsd:group ref="EG_FillProperties" minOccurs="1" maxOccurs="1"/>
  </xsd:complexType>
  <xsd:group name="EG_TextUnderlineLine">
    <xsd:choice>
      <xsd:element name="uLnTx" type="CT_TextUnderlineLineFollowText"/>
      <xsd:element name="uLn" type="CT_LineProperties" minOccurs="0" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:group name="EG_TextUnderlineFill">
    <xsd:choice>
      <xsd:element name="uFillTx" type="CT_TextUnderlineFillFollowText"/>
      <xsd:element name="uFill" type="CT_TextUnderlineFillGroupWrapper"/>
    </xsd:choice>
  </xsd:group>
  <xsd:simpleType name="ST_TextStrikeType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="noStrike"/>
      <xsd:enumeration value="sngStrike"/>
      <xsd:enumeration value="dblStrike"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextCapsType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="small"/>
      <xsd:enumeration value="all"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextCharacterProperties">
    <xsd:sequence>
      <xsd:element name="ln" type="CT_LineProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_FillProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_EffectProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="highlight" type="CT_Color" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_TextUnderlineLine" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_TextUnderlineFill" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="latin" type="CT_TextFont" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="ea" type="CT_TextFont" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="cs" type="CT_TextFont" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sym" type="CT_TextFont" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="hlinkClick" type="CT_Hyperlink" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="hlinkMouseOver" type="CT_Hyperlink" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="rtl" type="CT_Boolean" minOccurs="0"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="kumimoji" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="lang" type="s:ST_Lang" use="optional"/>
    <xsd:attribute name="altLang" type="s:ST_Lang" use="optional"/>
    <xsd:attribute name="sz" type="ST_TextFontSize" use="optional"/>
    <xsd:attribute name="b" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="i" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="u" type="ST_TextUnderlineType" use="optional"/>
    <xsd:attribute name="strike" type="ST_TextStrikeType" use="optional"/>
    <xsd:attribute name="kern" type="ST_TextNonNegativePoint" use="optional"/>
    <xsd:attribute name="cap" type="ST_TextCapsType" use="optional" default="none"/>
    <xsd:attribute name="spc" type="ST_TextPoint" use="optional"/>
    <xsd:attribute name="normalizeH" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="baseline" type="ST_Percentage" use="optional"/>
    <xsd:attribute name="noProof" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="dirty" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="err" type="xsd:boolean" use="optional" default="false"/>
    <xsd:attribute name="smtClean" type="xsd:boolean" use="optional" default="true"/>
    <xsd:attribute name="smtId" type="xsd:unsignedInt" use="optional" default="0"/>
    <xsd:attribute name="bmk" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Boolean">
    <xsd:attribute name="val" type="s:ST_OnOff" default="0"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextSpacingPoint">
    <xsd:restriction base="xsd:int">
      <xsd:minInclusive value="0"/>
      <xsd:maxInclusive value="158400"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextSpacingPercentOrPercentString">
    <xsd:union memberTypes="ST_TextSpacingPercent s:ST_Percentage"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextSpacingPercent">
    <xsd:restriction base="ST_PercentageDecimal">
      <xsd:minInclusive value="0"/>
      <xsd:maxInclusive value="13200000"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextSpacingPercent">
    <xsd:attribute name="val" type="ST_TextSpacingPercentOrPercentString" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TextSpacingPoint">
    <xsd:attribute name="val" type="ST_TextSpacingPoint" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextMargin">
    <xsd:restriction base="ST_Coordinate32Unqualified">
      <xsd:minInclusive value="0"/>
      <xsd:maxInclusive value="51206400"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextIndent">
    <xsd:restriction base="ST_Coordinate32Unqualified">
      <xsd:minInclusive value="-51206400"/>
      <xsd:maxInclusive value="51206400"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextTabAlignType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="l"/>
      <xsd:enumeration value="ctr"/>
      <xsd:enumeration value="r"/>
      <xsd:enumeration value="dec"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextTabStop">
    <xsd:attribute name="pos" type="ST_Coordinate32" use="optional"/>
    <xsd:attribute name="algn" type="ST_TextTabAlignType" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TextTabStopList">
    <xsd:sequence>
      <xsd:element name="tab" type="CT_TextTabStop" minOccurs="0" maxOccurs="32"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TextLineBreak">
    <xsd:sequence>
      <xsd:element name="rPr" type="CT_TextCharacterProperties" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TextSpacing">
    <xsd:choice>
      <xsd:element name="spcPct" type="CT_TextSpacingPercent"/>
      <xsd:element name="spcPts" type="CT_TextSpacingPoint"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextAlignType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="l"/>
      <xsd:enumeration value="ctr"/>
      <xsd:enumeration value="r"/>
      <xsd:enumeration value="just"/>
      <xsd:enumeration value="justLow"/>
      <xsd:enumeration value="dist"/>
      <xsd:enumeration value="thaiDist"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextFontAlignType">
    <xsd:restriction base="xsd:token">
      <xsd:enumeration value="auto"/>
      <xsd:enumeration value="t"/>
      <xsd:enumeration value="ctr"/>
      <xsd:enumeration value="base"/>
      <xsd:enumeration value="b"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextIndentLevelType">
    <xsd:restriction base="xsd:int">
      <xsd:minInclusive value="0"/>
      <xsd:maxInclusive value="8"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextParagraphProperties">
    <xsd:sequence>
      <xsd:element name="lnSpc" type="CT_TextSpacing" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="spcBef" type="CT_TextSpacing" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="spcAft" type="CT_TextSpacing" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_TextBulletColor" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_TextBulletSize" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_TextBulletTypeface" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_TextBullet" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tabLst" type="CT_TextTabStopList" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="defRPr" type="CT_TextCharacterProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="marL" type="ST_TextMargin" use="optional"/>
    <xsd:attribute name="marR" type="ST_TextMargin" use="optional"/>
    <xsd:attribute name="lvl" type="ST_TextIndentLevelType" use="optional"/>
    <xsd:attribute name="indent" type="ST_TextIndent" use="optional"/>
    <xsd:attribute name="algn" type="ST_TextAlignType" use="optional"/>
    <xsd:attribute name="defTabSz" type="ST_Coordinate32" use="optional"/>
    <xsd:attribute name="rtl" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="eaLnBrk" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="fontAlgn" type="ST_TextFontAlignType" use="optional"/>
    <xsd:attribute name="latinLnBrk" type="xsd:boolean" use="optional"/>
    <xsd:attribute name="hangingPunct" type="xsd:boolean" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TextField">
    <xsd:sequence>
      <xsd:element name="rPr" type="CT_TextCharacterProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="pPr" type="CT_TextParagraphProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="t" type="xsd:string" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="id" type="s:ST_Guid" use="required"/>
    <xsd:attribute name="type" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:group name="EG_TextRun">
    <xsd:choice>
      <xsd:element name="r" type="CT_RegularTextRun"/>
      <xsd:element name="br" type="CT_TextLineBreak"/>
      <xsd:element name="fld" type="CT_TextField"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_RegularTextRun">
    <xsd:sequence>
      <xsd:element name="rPr" type="CT_TextCharacterProperties" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="t" type="xsd:string" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
</xsd:schema>
