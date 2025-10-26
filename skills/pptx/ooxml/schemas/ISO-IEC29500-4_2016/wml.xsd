<?xml version="1.0" encoding="utf-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:sl="http://schemas.openxmlformats.org/schemaLibrary/2006/main"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:s="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  elementFormDefault="qualified" attributeFormDefault="qualified" blockDefault="#all"
  targetNamespace="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <xsd:import namespace="http://schemas.openxmlformats.org/markup-compatibility/2006" schemaLocation="../mce/mc.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
    schemaLocation="dml-wordprocessingDrawing.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/math"
    schemaLocation="shared-math.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    schemaLocation="shared-relationshipReference.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes"
    schemaLocation="shared-commonSimpleTypes.xsd"/>
  <xsd:import namespace="http://schemas.openxmlformats.org/schemaLibrary/2006/main"
    schemaLocation="shared-customXmlSchemaProperties.xsd"/>
  <xsd:import namespace="http://www.w3.org/XML/1998/namespace"/>
  <xsd:complexType name="CT_Empty"/>
  <xsd:complexType name="CT_OnOff">
    <xsd:attribute name="val" type="s:ST_OnOff"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_LongHexNumber">
    <xsd:restriction base="xsd:hexBinary">
      <xsd:length value="4"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_LongHexNumber">
    <xsd:attribute name="val" type="ST_LongHexNumber" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_ShortHexNumber">
    <xsd:restriction base="xsd:hexBinary">
      <xsd:length value="2"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_UcharHexNumber">
    <xsd:restriction base="xsd:hexBinary">
      <xsd:length value="1"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Charset">
    <xsd:attribute name="val" type="ST_UcharHexNumber" use="optional"/>
    <xsd:attribute name="characterSet" type="s:ST_String" use="optional" default="ISO-8859-1"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DecimalNumberOrPercent">
    <xsd:union memberTypes="ST_UnqualifiedPercentage s:ST_Percentage"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_UnqualifiedPercentage">
    <xsd:restriction base="xsd:decimal"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_DecimalNumber">
    <xsd:restriction base="xsd:integer"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_DecimalNumber">
    <xsd:attribute name="val" type="ST_DecimalNumber" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_UnsignedDecimalNumber">
    <xsd:attribute name="val" type="s:ST_UnsignedDecimalNumber" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DecimalNumberOrPrecent">
    <xsd:attribute name="val" type="ST_DecimalNumberOrPercent" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TwipsMeasure">
    <xsd:attribute name="val" type="s:ST_TwipsMeasure" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_SignedTwipsMeasure">
    <xsd:union memberTypes="xsd:integer s:ST_UniversalMeasure"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_SignedTwipsMeasure">
    <xsd:attribute name="val" type="ST_SignedTwipsMeasure" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PixelsMeasure">
    <xsd:restriction base="s:ST_UnsignedDecimalNumber"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_PixelsMeasure">
    <xsd:attribute name="val" type="ST_PixelsMeasure" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_HpsMeasure">
    <xsd:union memberTypes="s:ST_UnsignedDecimalNumber s:ST_PositiveUniversalMeasure"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_HpsMeasure">
    <xsd:attribute name="val" type="ST_HpsMeasure" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_SignedHpsMeasure">
    <xsd:union memberTypes="xsd:integer s:ST_UniversalMeasure"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_SignedHpsMeasure">
    <xsd:attribute name="val" type="ST_SignedHpsMeasure" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DateTime">
    <xsd:restriction base="xsd:dateTime"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_MacroName">
    <xsd:restriction base="xsd:string">
      <xsd:maxLength value="33"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_MacroName">
    <xsd:attribute name="val" use="required" type="ST_MacroName"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_EighthPointMeasure">
    <xsd:restriction base="s:ST_UnsignedDecimalNumber"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PointMeasure">
    <xsd:restriction base="s:ST_UnsignedDecimalNumber"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_String">
    <xsd:attribute name="val" type="s:ST_String" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextScale">
    <xsd:union memberTypes="ST_TextScalePercent ST_TextScaleDecimal"/>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextScalePercent">
    <xsd:restriction base="xsd:string">
      <xsd:pattern value="0*(600|([0-5]?[0-9]?[0-9]))%"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TextScaleDecimal">
    <xsd:restriction base="xsd:integer">
      <xsd:minInclusive value="0"/>
      <xsd:maxInclusive value="600"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextScale">
    <xsd:attribute name="val" type="ST_TextScale"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_HighlightColor">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="black"/>
      <xsd:enumeration value="blue"/>
      <xsd:enumeration value="cyan"/>
      <xsd:enumeration value="green"/>
      <xsd:enumeration value="magenta"/>
      <xsd:enumeration value="red"/>
      <xsd:enumeration value="yellow"/>
      <xsd:enumeration value="white"/>
      <xsd:enumeration value="darkBlue"/>
      <xsd:enumeration value="darkCyan"/>
      <xsd:enumeration value="darkGreen"/>
      <xsd:enumeration value="darkMagenta"/>
      <xsd:enumeration value="darkRed"/>
      <xsd:enumeration value="darkYellow"/>
      <xsd:enumeration value="darkGray"/>
      <xsd:enumeration value="lightGray"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Highlight">
    <xsd:attribute name="val" type="ST_HighlightColor" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_HexColorAuto">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="auto"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_HexColor">
    <xsd:union memberTypes="ST_HexColorAuto s:ST_HexColorRGB"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_Color">
    <xsd:attribute name="val" type="ST_HexColor" use="required"/>
    <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
    <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
    <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Lang">
    <xsd:attribute name="val" type="s:ST_Lang" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Guid">
    <xsd:attribute name="val" type="s:ST_Guid"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Underline">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="single"/>
      <xsd:enumeration value="words"/>
      <xsd:enumeration value="double"/>
      <xsd:enumeration value="thick"/>
      <xsd:enumeration value="dotted"/>
      <xsd:enumeration value="dottedHeavy"/>
      <xsd:enumeration value="dash"/>
      <xsd:enumeration value="dashedHeavy"/>
      <xsd:enumeration value="dashLong"/>
      <xsd:enumeration value="dashLongHeavy"/>
      <xsd:enumeration value="dotDash"/>
      <xsd:enumeration value="dashDotHeavy"/>
      <xsd:enumeration value="dotDotDash"/>
      <xsd:enumeration value="dashDotDotHeavy"/>
      <xsd:enumeration value="wave"/>
      <xsd:enumeration value="wavyHeavy"/>
      <xsd:enumeration value="wavyDouble"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Underline">
    <xsd:attribute name="val" type="ST_Underline" use="optional"/>
    <xsd:attribute name="color" type="ST_HexColor" use="optional" default="auto"/>
    <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
    <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
    <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextEffect">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="blinkBackground"/>
      <xsd:enumeration value="lights"/>
      <xsd:enumeration value="antsBlack"/>
      <xsd:enumeration value="antsRed"/>
      <xsd:enumeration value="shimmer"/>
      <xsd:enumeration value="sparkle"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextEffect">
    <xsd:attribute name="val" type="ST_TextEffect" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Border">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="nil"/>
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="single"/>
      <xsd:enumeration value="thick"/>
      <xsd:enumeration value="double"/>
      <xsd:enumeration value="dotted"/>
      <xsd:enumeration value="dashed"/>
      <xsd:enumeration value="dotDash"/>
      <xsd:enumeration value="dotDotDash"/>
      <xsd:enumeration value="triple"/>
      <xsd:enumeration value="thinThickSmallGap"/>
      <xsd:enumeration value="thickThinSmallGap"/>
      <xsd:enumeration value="thinThickThinSmallGap"/>
      <xsd:enumeration value="thinThickMediumGap"/>
      <xsd:enumeration value="thickThinMediumGap"/>
      <xsd:enumeration value="thinThickThinMediumGap"/>
      <xsd:enumeration value="thinThickLargeGap"/>
      <xsd:enumeration value="thickThinLargeGap"/>
      <xsd:enumeration value="thinThickThinLargeGap"/>
      <xsd:enumeration value="wave"/>
      <xsd:enumeration value="doubleWave"/>
      <xsd:enumeration value="dashSmallGap"/>
      <xsd:enumeration value="dashDotStroked"/>
      <xsd:enumeration value="threeDEmboss"/>
      <xsd:enumeration value="threeDEngrave"/>
      <xsd:enumeration value="outset"/>
      <xsd:enumeration value="inset"/>
      <xsd:enumeration value="apples"/>
      <xsd:enumeration value="archedScallops"/>
      <xsd:enumeration value="babyPacifier"/>
      <xsd:enumeration value="babyRattle"/>
      <xsd:enumeration value="balloons3Colors"/>
      <xsd:enumeration value="balloonsHotAir"/>
      <xsd:enumeration value="basicBlackDashes"/>
      <xsd:enumeration value="basicBlackDots"/>
      <xsd:enumeration value="basicBlackSquares"/>
      <xsd:enumeration value="basicThinLines"/>
      <xsd:enumeration value="basicWhiteDashes"/>
      <xsd:enumeration value="basicWhiteDots"/>
      <xsd:enumeration value="basicWhiteSquares"/>
      <xsd:enumeration value="basicWideInline"/>
      <xsd:enumeration value="basicWideMidline"/>
      <xsd:enumeration value="basicWideOutline"/>
      <xsd:enumeration value="bats"/>
      <xsd:enumeration value="birds"/>
      <xsd:enumeration value="birdsFlight"/>
      <xsd:enumeration value="cabins"/>
      <xsd:enumeration value="cakeSlice"/>
      <xsd:enumeration value="candyCorn"/>
      <xsd:enumeration value="celticKnotwork"/>
      <xsd:enumeration value="certificateBanner"/>
      <xsd:enumeration value="chainLink"/>
      <xsd:enumeration value="champagneBottle"/>
      <xsd:enumeration value="checkedBarBlack"/>
      <xsd:enumeration value="checkedBarColor"/>
      <xsd:enumeration value="checkered"/>
      <xsd:enumeration value="christmasTree"/>
      <xsd:enumeration value="circlesLines"/>
      <xsd:enumeration value="circlesRectangles"/>
      <xsd:enumeration value="classicalWave"/>
      <xsd:enumeration value="clocks"/>
      <xsd:enumeration value="compass"/>
      <xsd:enumeration value="confetti"/>
      <xsd:enumeration value="confettiGrays"/>
      <xsd:enumeration value="confettiOutline"/>
      <xsd:enumeration value="confettiStreamers"/>
      <xsd:enumeration value="confettiWhite"/>
      <xsd:enumeration value="cornerTriangles"/>
      <xsd:enumeration value="couponCutoutDashes"/>
      <xsd:enumeration value="couponCutoutDots"/>
      <xsd:enumeration value="crazyMaze"/>
      <xsd:enumeration value="creaturesButterfly"/>
      <xsd:enumeration value="creaturesFish"/>
      <xsd:enumeration value="creaturesInsects"/>
      <xsd:enumeration value="creaturesLadyBug"/>
      <xsd:enumeration value="crossStitch"/>
      <xsd:enumeration value="cup"/>
      <xsd:enumeration value="decoArch"/>
      <xsd:enumeration value="decoArchColor"/>
      <xsd:enumeration value="decoBlocks"/>
      <xsd:enumeration value="diamondsGray"/>
      <xsd:enumeration value="doubleD"/>
      <xsd:enumeration value="doubleDiamonds"/>
      <xsd:enumeration value="earth1"/>
      <xsd:enumeration value="earth2"/>
      <xsd:enumeration value="earth3"/>
      <xsd:enumeration value="eclipsingSquares1"/>
      <xsd:enumeration value="eclipsingSquares2"/>
      <xsd:enumeration value="eggsBlack"/>
      <xsd:enumeration value="fans"/>
      <xsd:enumeration value="film"/>
      <xsd:enumeration value="firecrackers"/>
      <xsd:enumeration value="flowersBlockPrint"/>
      <xsd:enumeration value="flowersDaisies"/>
      <xsd:enumeration value="flowersModern1"/>
      <xsd:enumeration value="flowersModern2"/>
      <xsd:enumeration value="flowersPansy"/>
      <xsd:enumeration value="flowersRedRose"/>
      <xsd:enumeration value="flowersRoses"/>
      <xsd:enumeration value="flowersTeacup"/>
      <xsd:enumeration value="flowersTiny"/>
      <xsd:enumeration value="gems"/>
      <xsd:enumeration value="gingerbreadMan"/>
      <xsd:enumeration value="gradient"/>
      <xsd:enumeration value="handmade1"/>
      <xsd:enumeration value="handmade2"/>
      <xsd:enumeration value="heartBalloon"/>
      <xsd:enumeration value="heartGray"/>
      <xsd:enumeration value="hearts"/>
      <xsd:enumeration value="heebieJeebies"/>
      <xsd:enumeration value="holly"/>
      <xsd:enumeration value="houseFunky"/>
      <xsd:enumeration value="hypnotic"/>
      <xsd:enumeration value="iceCreamCones"/>
      <xsd:enumeration value="lightBulb"/>
      <xsd:enumeration value="lightning1"/>
      <xsd:enumeration value="lightning2"/>
      <xsd:enumeration value="mapPins"/>
      <xsd:enumeration value="mapleLeaf"/>
      <xsd:enumeration value="mapleMuffins"/>
      <xsd:enumeration value="marquee"/>
      <xsd:enumeration value="marqueeToothed"/>
      <xsd:enumeration value="moons"/>
      <xsd:enumeration value="mosaic"/>
      <xsd:enumeration value="musicNotes"/>
      <xsd:enumeration value="northwest"/>
      <xsd:enumeration value="ovals"/>
      <xsd:enumeration value="packages"/>
      <xsd:enumeration value="palmsBlack"/>
      <xsd:enumeration value="palmsColor"/>
      <xsd:enumeration value="paperClips"/>
      <xsd:enumeration value="papyrus"/>
      <xsd:enumeration value="partyFavor"/>
      <xsd:enumeration value="partyGlass"/>
      <xsd:enumeration value="pencils"/>
      <xsd:enumeration value="people"/>
      <xsd:enumeration value="peopleWaving"/>
      <xsd:enumeration value="peopleHats"/>
      <xsd:enumeration value="poinsettias"/>
      <xsd:enumeration value="postageStamp"/>
      <xsd:enumeration value="pumpkin1"/>
      <xsd:enumeration value="pushPinNote2"/>
      <xsd:enumeration value="pushPinNote1"/>
      <xsd:enumeration value="pyramids"/>
      <xsd:enumeration value="pyramidsAbove"/>
      <xsd:enumeration value="quadrants"/>
      <xsd:enumeration value="rings"/>
      <xsd:enumeration value="safari"/>
      <xsd:enumeration value="sawtooth"/>
      <xsd:enumeration value="sawtoothGray"/>
      <xsd:enumeration value="scaredCat"/>
      <xsd:enumeration value="seattle"/>
      <xsd:enumeration value="shadowedSquares"/>
      <xsd:enumeration value="sharksTeeth"/>
      <xsd:enumeration value="shorebirdTracks"/>
      <xsd:enumeration value="skyrocket"/>
      <xsd:enumeration value="snowflakeFancy"/>
      <xsd:enumeration value="snowflakes"/>
      <xsd:enumeration value="sombrero"/>
      <xsd:enumeration value="southwest"/>
      <xsd:enumeration value="stars"/>
      <xsd:enumeration value="starsTop"/>
      <xsd:enumeration value="stars3d"/>
      <xsd:enumeration value="starsBlack"/>
      <xsd:enumeration value="starsShadowed"/>
      <xsd:enumeration value="sun"/>
      <xsd:enumeration value="swirligig"/>
      <xsd:enumeration value="tornPaper"/>
      <xsd:enumeration value="tornPaperBlack"/>
      <xsd:enumeration value="trees"/>
      <xsd:enumeration value="triangleParty"/>
      <xsd:enumeration value="triangles"/>
      <xsd:enumeration value="triangle1"/>
      <xsd:enumeration value="triangle2"/>
      <xsd:enumeration value="triangleCircle1"/>
      <xsd:enumeration value="triangleCircle2"/>
      <xsd:enumeration value="shapes1"/>
      <xsd:enumeration value="shapes2"/>
      <xsd:enumeration value="twistedLines1"/>
      <xsd:enumeration value="twistedLines2"/>
      <xsd:enumeration value="vine"/>
      <xsd:enumeration value="waveline"/>
      <xsd:enumeration value="weavingAngles"/>
      <xsd:enumeration value="weavingBraid"/>
      <xsd:enumeration value="weavingRibbon"/>
      <xsd:enumeration value="weavingStrips"/>
      <xsd:enumeration value="whiteFlowers"/>
      <xsd:enumeration value="woodwork"/>
      <xsd:enumeration value="xIllusions"/>
      <xsd:enumeration value="zanyTriangles"/>
      <xsd:enumeration value="zigZag"/>
      <xsd:enumeration value="zigZagStitch"/>
      <xsd:enumeration value="custom"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Border">
    <xsd:attribute name="val" type="ST_Border" use="required"/>
    <xsd:attribute name="color" type="ST_HexColor" use="optional" default="auto"/>
    <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
    <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
    <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
    <xsd:attribute name="sz" type="ST_EighthPointMeasure" use="optional"/>
    <xsd:attribute name="space" type="ST_PointMeasure" use="optional" default="0"/>
    <xsd:attribute name="shadow" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="frame" type="s:ST_OnOff" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Shd">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="nil"/>
      <xsd:enumeration value="clear"/>
      <xsd:enumeration value="solid"/>
      <xsd:enumeration value="horzStripe"/>
      <xsd:enumeration value="vertStripe"/>
      <xsd:enumeration value="reverseDiagStripe"/>
      <xsd:enumeration value="diagStripe"/>
      <xsd:enumeration value="horzCross"/>
      <xsd:enumeration value="diagCross"/>
      <xsd:enumeration value="thinHorzStripe"/>
      <xsd:enumeration value="thinVertStripe"/>
      <xsd:enumeration value="thinReverseDiagStripe"/>
      <xsd:enumeration value="thinDiagStripe"/>
      <xsd:enumeration value="thinHorzCross"/>
      <xsd:enumeration value="thinDiagCross"/>
      <xsd:enumeration value="pct5"/>
      <xsd:enumeration value="pct10"/>
      <xsd:enumeration value="pct12"/>
      <xsd:enumeration value="pct15"/>
      <xsd:enumeration value="pct20"/>
      <xsd:enumeration value="pct25"/>
      <xsd:enumeration value="pct30"/>
      <xsd:enumeration value="pct35"/>
      <xsd:enumeration value="pct37"/>
      <xsd:enumeration value="pct40"/>
      <xsd:enumeration value="pct45"/>
      <xsd:enumeration value="pct50"/>
      <xsd:enumeration value="pct55"/>
      <xsd:enumeration value="pct60"/>
      <xsd:enumeration value="pct62"/>
      <xsd:enumeration value="pct65"/>
      <xsd:enumeration value="pct70"/>
      <xsd:enumeration value="pct75"/>
      <xsd:enumeration value="pct80"/>
      <xsd:enumeration value="pct85"/>
      <xsd:enumeration value="pct87"/>
      <xsd:enumeration value="pct90"/>
      <xsd:enumeration value="pct95"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Shd">
    <xsd:attribute name="val" type="ST_Shd" use="required"/>
    <xsd:attribute name="color" type="ST_HexColor" use="optional"/>
    <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
    <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
    <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
    <xsd:attribute name="fill" type="ST_HexColor" use="optional"/>
    <xsd:attribute name="themeFill" type="ST_ThemeColor" use="optional"/>
    <xsd:attribute name="themeFillTint" type="ST_UcharHexNumber" use="optional"/>
    <xsd:attribute name="themeFillShade" type="ST_UcharHexNumber" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_VerticalAlignRun">
    <xsd:attribute name="val" type="s:ST_VerticalAlignRun" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FitText">
    <xsd:attribute name="val" type="s:ST_TwipsMeasure" use="required"/>
    <xsd:attribute name="id" type="ST_DecimalNumber" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Em">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="dot"/>
      <xsd:enumeration value="comma"/>
      <xsd:enumeration value="circle"/>
      <xsd:enumeration value="underDot"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Em">
    <xsd:attribute name="val" type="ST_Em" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Language">
    <xsd:attribute name="val" type="s:ST_Lang" use="optional"/>
    <xsd:attribute name="eastAsia" type="s:ST_Lang" use="optional"/>
    <xsd:attribute name="bidi" type="s:ST_Lang" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_CombineBrackets">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="round"/>
      <xsd:enumeration value="square"/>
      <xsd:enumeration value="angle"/>
      <xsd:enumeration value="curly"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_EastAsianLayout">
    <xsd:attribute name="id" type="ST_DecimalNumber" use="optional"/>
    <xsd:attribute name="combine" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="combineBrackets" type="ST_CombineBrackets" use="optional"/>
    <xsd:attribute name="vert" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="vertCompress" type="s:ST_OnOff" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_HeightRule">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="auto"/>
      <xsd:enumeration value="exact"/>
      <xsd:enumeration value="atLeast"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Wrap">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="auto"/>
      <xsd:enumeration value="notBeside"/>
      <xsd:enumeration value="around"/>
      <xsd:enumeration value="tight"/>
      <xsd:enumeration value="through"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_VAnchor">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="text"/>
      <xsd:enumeration value="margin"/>
      <xsd:enumeration value="page"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_HAnchor">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="text"/>
      <xsd:enumeration value="margin"/>
      <xsd:enumeration value="page"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_DropCap">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="drop"/>
      <xsd:enumeration value="margin"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_FramePr">
    <xsd:attribute name="dropCap" type="ST_DropCap" use="optional"/>
    <xsd:attribute name="lines" type="ST_DecimalNumber" use="optional"/>
    <xsd:attribute name="w" type="s:ST_TwipsMeasure" use="optional"/>
    <xsd:attribute name="h" type="s:ST_TwipsMeasure" use="optional"/>
    <xsd:attribute name="vSpace" type="s:ST_TwipsMeasure" use="optional"/>
    <xsd:attribute name="hSpace" type="s:ST_TwipsMeasure" use="optional"/>
    <xsd:attribute name="wrap" type="ST_Wrap" use="optional"/>
    <xsd:attribute name="hAnchor" type="ST_HAnchor" use="optional"/>
    <xsd:attribute name="vAnchor" type="ST_VAnchor" use="optional"/>
    <xsd:attribute name="x" type="ST_SignedTwipsMeasure" use="optional"/>
    <xsd:attribute name="xAlign" type="s:ST_XAlign" use="optional"/>
    <xsd:attribute name="y" type="ST_SignedTwipsMeasure" use="optional"/>
    <xsd:attribute name="yAlign" type="s:ST_YAlign" use="optional"/>
    <xsd:attribute name="hRule" type="ST_HeightRule" use="optional"/>
    <xsd:attribute name="anchorLock" type="s:ST_OnOff" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TabJc">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="clear"/>
      <xsd:enumeration value="start"/>
      <xsd:enumeration value="center"/>
      <xsd:enumeration value="end"/>
      <xsd:enumeration value="decimal"/>
      <xsd:enumeration value="bar"/>
      <xsd:enumeration value="num"/>
      <xsd:enumeration value="left"/>
      <xsd:enumeration value="right"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_TabTlc">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="dot"/>
      <xsd:enumeration value="hyphen"/>
      <xsd:enumeration value="underscore"/>
      <xsd:enumeration value="heavy"/>
      <xsd:enumeration value="middleDot"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TabStop">
    <xsd:attribute name="val" type="ST_TabJc" use="required"/>
    <xsd:attribute name="leader" type="ST_TabTlc" use="optional"/>
    <xsd:attribute name="pos" type="ST_SignedTwipsMeasure" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_LineSpacingRule">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="auto"/>
      <xsd:enumeration value="exact"/>
      <xsd:enumeration value="atLeast"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Spacing">
    <xsd:attribute name="before" type="s:ST_TwipsMeasure" use="optional" default="0"/>
    <xsd:attribute name="beforeLines" type="ST_DecimalNumber" use="optional" default="0"/>
    <xsd:attribute name="beforeAutospacing" type="s:ST_OnOff" use="optional" default="off"/>
    <xsd:attribute name="after" type="s:ST_TwipsMeasure" use="optional" default="0"/>
    <xsd:attribute name="afterLines" type="ST_DecimalNumber" use="optional" default="0"/>
    <xsd:attribute name="afterAutospacing" type="s:ST_OnOff" use="optional" default="off"/>
    <xsd:attribute name="line" type="ST_SignedTwipsMeasure" use="optional" default="0"/>
    <xsd:attribute name="lineRule" type="ST_LineSpacingRule" use="optional" default="auto"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Ind">
    <xsd:attribute name="start" type="ST_SignedTwipsMeasure" use="optional"/>
    <xsd:attribute name="startChars" type="ST_DecimalNumber" use="optional"/>
    <xsd:attribute name="end" type="ST_SignedTwipsMeasure" use="optional"/>
    <xsd:attribute name="endChars" type="ST_DecimalNumber" use="optional"/>
    <xsd:attribute name="left" type="ST_SignedTwipsMeasure" use="optional"/>
    <xsd:attribute name="leftChars" type="ST_DecimalNumber" use="optional"/>
    <xsd:attribute name="right" type="ST_SignedTwipsMeasure" use="optional"/>
    <xsd:attribute name="rightChars" type="ST_DecimalNumber" use="optional"/>
    <xsd:attribute name="hanging" type="s:ST_TwipsMeasure" use="optional"/>
    <xsd:attribute name="hangingChars" type="ST_DecimalNumber" use="optional"/>
    <xsd:attribute name="firstLine" type="s:ST_TwipsMeasure" use="optional"/>
    <xsd:attribute name="firstLineChars" type="ST_DecimalNumber" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Jc">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="start"/>
      <xsd:enumeration value="center"/>
      <xsd:enumeration value="end"/>
      <xsd:enumeration value="both"/>
      <xsd:enumeration value="mediumKashida"/>
      <xsd:enumeration value="distribute"/>
      <xsd:enumeration value="numTab"/>
      <xsd:enumeration value="highKashida"/>
      <xsd:enumeration value="lowKashida"/>
      <xsd:enumeration value="thaiDistribute"/>
      <xsd:enumeration value="left"/>
      <xsd:enumeration value="right"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_JcTable">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="center"/>
      <xsd:enumeration value="end"/>
      <xsd:enumeration value="left"/>
      <xsd:enumeration value="right"/>
      <xsd:enumeration value="start"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Jc">
    <xsd:attribute name="val" type="ST_Jc" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_JcTable">
    <xsd:attribute name="val" type="ST_JcTable" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_View">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="print"/>
      <xsd:enumeration value="outline"/>
      <xsd:enumeration value="masterPages"/>
      <xsd:enumeration value="normal"/>
      <xsd:enumeration value="web"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_View">
    <xsd:attribute name="val" type="ST_View" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Zoom">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="fullPage"/>
      <xsd:enumeration value="bestFit"/>
      <xsd:enumeration value="textFit"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Zoom">
    <xsd:attribute name="val" type="ST_Zoom" use="optional"/>
    <xsd:attribute name="percent" type="ST_DecimalNumberOrPercent" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_WritingStyle">
    <xsd:attribute name="lang" type="s:ST_Lang" use="required"/>
    <xsd:attribute name="vendorID" type="s:ST_String" use="required"/>
    <xsd:attribute name="dllVersion" type="s:ST_String" use="required"/>
    <xsd:attribute name="nlCheck" type="s:ST_OnOff" use="optional" default="off"/>
    <xsd:attribute name="checkStyle" type="s:ST_OnOff" use="required"/>
    <xsd:attribute name="appName" type="s:ST_String" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Proof">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="clean"/>
      <xsd:enumeration value="dirty"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Proof">
    <xsd:attribute name="spelling" type="ST_Proof" use="optional"/>
    <xsd:attribute name="grammar" type="ST_Proof" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DocType">
    <xsd:restriction base="xsd:string"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_DocType">
    <xsd:attribute name="val" type="ST_DocType" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DocProtect">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="readOnly"/>
      <xsd:enumeration value="comments"/>
      <xsd:enumeration value="trackedChanges"/>
      <xsd:enumeration value="forms"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:attributeGroup name="AG_Password">
    <xsd:attribute name="algorithmName" type="s:ST_String" use="optional"/>
    <xsd:attribute name="hashValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="saltValue" type="xsd:base64Binary" use="optional"/>
    <xsd:attribute name="spinCount" type="ST_DecimalNumber" use="optional"/>
  </xsd:attributeGroup>
  <xsd:attributeGroup name="AG_TransitionalPassword">
    <xsd:attribute name="cryptProviderType" type="s:ST_CryptProv"/>
    <xsd:attribute name="cryptAlgorithmClass" type="s:ST_AlgClass"/>
    <xsd:attribute name="cryptAlgorithmType" type="s:ST_AlgType"/>
    <xsd:attribute name="cryptAlgorithmSid" type="ST_DecimalNumber"/>
    <xsd:attribute name="cryptSpinCount" type="ST_DecimalNumber"/>
    <xsd:attribute name="cryptProvider" type="s:ST_String"/>
    <xsd:attribute name="algIdExt" type="ST_LongHexNumber"/>
    <xsd:attribute name="algIdExtSource" type="s:ST_String"/>
    <xsd:attribute name="cryptProviderTypeExt" type="ST_LongHexNumber"/>
    <xsd:attribute name="cryptProviderTypeExtSource" type="s:ST_String"/>
    <xsd:attribute name="hash" type="xsd:base64Binary"/>
    <xsd:attribute name="salt" type="xsd:base64Binary"/>
  </xsd:attributeGroup>
  <xsd:complexType name="CT_DocProtect">
    <xsd:attribute name="edit" type="ST_DocProtect" use="optional"/>
    <xsd:attribute name="formatting" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="enforcement" type="s:ST_OnOff"/>
    <xsd:attributeGroup ref="AG_Password"/>
    <xsd:attributeGroup ref="AG_TransitionalPassword"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_MailMergeDocType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="catalog"/>
      <xsd:enumeration value="envelopes"/>
      <xsd:enumeration value="mailingLabels"/>
      <xsd:enumeration value="formLetters"/>
      <xsd:enumeration value="email"/>
      <xsd:enumeration value="fax"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_MailMergeDocType">
    <xsd:attribute name="val" type="ST_MailMergeDocType" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_MailMergeDataType">
    <xsd:restriction base="xsd:string"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_MailMergeDataType">
    <xsd:attribute name="val" type="ST_MailMergeDataType" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_MailMergeDest">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="newDocument"/>
      <xsd:enumeration value="printer"/>
      <xsd:enumeration value="email"/>
      <xsd:enumeration value="fax"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_MailMergeDest">
    <xsd:attribute name="val" type="ST_MailMergeDest" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_MailMergeOdsoFMDFieldType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="null"/>
      <xsd:enumeration value="dbColumn"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_MailMergeOdsoFMDFieldType">
    <xsd:attribute name="val" type="ST_MailMergeOdsoFMDFieldType" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TrackChangesView">
    <xsd:attribute name="markup" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="comments" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="insDel" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="formatting" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="inkAnnotations" type="s:ST_OnOff" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Kinsoku">
    <xsd:attribute name="lang" type="s:ST_Lang" use="required"/>
    <xsd:attribute name="val" type="s:ST_String" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextDirection">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="tb"/>
      <xsd:enumeration value="rl"/>
      <xsd:enumeration value="lr"/>
      <xsd:enumeration value="tbV"/>
      <xsd:enumeration value="rlV"/>
      <xsd:enumeration value="lrV"/>
      <xsd:enumeration value="btLr"/>
      <xsd:enumeration value="lrTb"/>
      <xsd:enumeration value="lrTbV"/>
      <xsd:enumeration value="tbLrV"/>
      <xsd:enumeration value="tbRl"/>
      <xsd:enumeration value="tbRlV"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextDirection">
    <xsd:attribute name="val" type="ST_TextDirection" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextAlignment">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="top"/>
      <xsd:enumeration value="center"/>
      <xsd:enumeration value="baseline"/>
      <xsd:enumeration value="bottom"/>
      <xsd:enumeration value="auto"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextAlignment">
    <xsd:attribute name="val" type="ST_TextAlignment" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DisplacedByCustomXml">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="next"/>
      <xsd:enumeration value="prev"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_AnnotationVMerge">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="cont"/>
      <xsd:enumeration value="rest"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Markup">
    <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TrackChange">
    <xsd:complexContent>
      <xsd:extension base="CT_Markup">
        <xsd:attribute name="author" type="s:ST_String" use="required"/>
        <xsd:attribute name="date" type="ST_DateTime" use="optional"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_CellMergeTrackChange">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:attribute name="vMerge" type="ST_AnnotationVMerge" use="optional"/>
        <xsd:attribute name="vMergeOrig" type="ST_AnnotationVMerge" use="optional"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_TrackChangeRange">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:attribute name="displacedByCustomXml" type="ST_DisplacedByCustomXml" use="optional"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_MarkupRange">
    <xsd:complexContent>
      <xsd:extension base="CT_Markup">
        <xsd:attribute name="displacedByCustomXml" type="ST_DisplacedByCustomXml" use="optional"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_BookmarkRange">
    <xsd:complexContent>
      <xsd:extension base="CT_MarkupRange">
        <xsd:attribute name="colFirst" type="ST_DecimalNumber" use="optional"/>
        <xsd:attribute name="colLast" type="ST_DecimalNumber" use="optional"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_Bookmark">
    <xsd:complexContent>
      <xsd:extension base="CT_BookmarkRange">
        <xsd:attribute name="name" type="s:ST_String" use="required"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_MoveBookmark">
    <xsd:complexContent>
      <xsd:extension base="CT_Bookmark">
        <xsd:attribute name="author" type="s:ST_String" use="required"/>
        <xsd:attribute name="date" type="ST_DateTime" use="required"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_Comment">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:sequence>
          <xsd:group ref="EG_BlockLevelElts" minOccurs="0" maxOccurs="unbounded"/>
        </xsd:sequence>
        <xsd:attribute name="initials" type="s:ST_String" use="optional"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_TrackChangeNumbering">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:attribute name="original" type="s:ST_String" use="optional"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_TblPrExChange">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:sequence>
          <xsd:element name="tblPrEx" type="CT_TblPrExBase" minOccurs="1"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_TcPrChange">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:sequence>
          <xsd:element name="tcPr" type="CT_TcPrInner" minOccurs="1"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_TrPrChange">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:sequence>
          <xsd:element name="trPr" type="CT_TrPrBase" minOccurs="1"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_TblGridChange">
    <xsd:complexContent>
      <xsd:extension base="CT_Markup">
        <xsd:sequence>
          <xsd:element name="tblGrid" type="CT_TblGridBase"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_TblPrChange">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:sequence>
          <xsd:element name="tblPr" type="CT_TblPrBase"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_SectPrChange">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:sequence>
          <xsd:element name="sectPr" type="CT_SectPrBase" minOccurs="0"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_PPrChange">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:sequence>
          <xsd:element name="pPr" type="CT_PPrBase" minOccurs="1"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_RPrChange">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:sequence>
          <xsd:element name="rPr" type="CT_RPrOriginal" minOccurs="1"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_ParaRPrChange">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:sequence>
          <xsd:element name="rPr" type="CT_ParaRPrOriginal" minOccurs="1"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_RunTrackChange">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:choice minOccurs="0" maxOccurs="unbounded">
          <xsd:group ref="EG_ContentRunContent"/>
          <xsd:group ref="m:EG_OMathMathElements"/>
        </xsd:choice>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:group name="EG_PContentMath">
    <xsd:choice>
      <xsd:group ref="EG_PContentBase" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:group ref="EG_ContentRunContentBase" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:group>
  <xsd:group name="EG_PContentBase">
    <xsd:choice>
      <xsd:element name="customXml" type="CT_CustomXmlRun"/>
      <xsd:element name="fldSimple" type="CT_SimpleField" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="hyperlink" type="CT_Hyperlink"/>
    </xsd:choice>
  </xsd:group>
  <xsd:group name="EG_ContentRunContentBase">
    <xsd:choice>
      <xsd:element name="smartTag" type="CT_SmartTagRun"/>
      <xsd:element name="sdt" type="CT_SdtRun"/>
      <xsd:group ref="EG_RunLevelElts" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:group>
  <xsd:group name="EG_CellMarkupElements">
    <xsd:choice>
      <xsd:element name="cellIns" type="CT_TrackChange" minOccurs="0"/>
      <xsd:element name="cellDel" type="CT_TrackChange" minOccurs="0"/>
      <xsd:element name="cellMerge" type="CT_CellMergeTrackChange" minOccurs="0"/>
    </xsd:choice>
  </xsd:group>
  <xsd:group name="EG_RangeMarkupElements">
    <xsd:choice>
      <xsd:element name="bookmarkStart" type="CT_Bookmark"/>
      <xsd:element name="bookmarkEnd" type="CT_MarkupRange"/>
      <xsd:element name="moveFromRangeStart" type="CT_MoveBookmark"/>
      <xsd:element name="moveFromRangeEnd" type="CT_MarkupRange"/>
      <xsd:element name="moveToRangeStart" type="CT_MoveBookmark"/>
      <xsd:element name="moveToRangeEnd" type="CT_MarkupRange"/>
      <xsd:element name="commentRangeStart" type="CT_MarkupRange"/>
      <xsd:element name="commentRangeEnd" type="CT_MarkupRange"/>
      <xsd:element name="customXmlInsRangeStart" type="CT_TrackChange"/>
      <xsd:element name="customXmlInsRangeEnd" type="CT_Markup"/>
      <xsd:element name="customXmlDelRangeStart" type="CT_TrackChange"/>
      <xsd:element name="customXmlDelRangeEnd" type="CT_Markup"/>
      <xsd:element name="customXmlMoveFromRangeStart" type="CT_TrackChange"/>
      <xsd:element name="customXmlMoveFromRangeEnd" type="CT_Markup"/>
      <xsd:element name="customXmlMoveToRangeStart" type="CT_TrackChange"/>
      <xsd:element name="customXmlMoveToRangeEnd" type="CT_Markup"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_NumPr">
    <xsd:sequence>
      <xsd:element name="ilvl" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="numId" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="numberingChange" type="CT_TrackChangeNumbering" minOccurs="0"/>
      <xsd:element name="ins" type="CT_TrackChange" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_PBdr">
    <xsd:sequence>
      <xsd:element name="top" type="CT_Border" minOccurs="0"/>
      <xsd:element name="left" type="CT_Border" minOccurs="0"/>
      <xsd:element name="bottom" type="CT_Border" minOccurs="0"/>
      <xsd:element name="right" type="CT_Border" minOccurs="0"/>
      <xsd:element name="between" type="CT_Border" minOccurs="0"/>
      <xsd:element name="bar" type="CT_Border" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Tabs">
    <xsd:sequence>
      <xsd:element name="tab" type="CT_TabStop" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_TextboxTightWrap">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="allLines"/>
      <xsd:enumeration value="firstAndLastLine"/>
      <xsd:enumeration value="firstLineOnly"/>
      <xsd:enumeration value="lastLineOnly"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TextboxTightWrap">
    <xsd:attribute name="val" type="ST_TextboxTightWrap" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PPrBase">
    <xsd:sequence>
      <xsd:element name="pStyle" type="CT_String" minOccurs="0"/>
      <xsd:element name="keepNext" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="keepLines" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="pageBreakBefore" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="framePr" type="CT_FramePr" minOccurs="0"/>
      <xsd:element name="widowControl" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="numPr" type="CT_NumPr" minOccurs="0"/>
      <xsd:element name="suppressLineNumbers" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="pBdr" type="CT_PBdr" minOccurs="0"/>
      <xsd:element name="shd" type="CT_Shd" minOccurs="0"/>
      <xsd:element name="tabs" type="CT_Tabs" minOccurs="0"/>
      <xsd:element name="suppressAutoHyphens" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="kinsoku" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="wordWrap" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="overflowPunct" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="topLinePunct" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="autoSpaceDE" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="autoSpaceDN" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="bidi" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="adjustRightInd" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="snapToGrid" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="spacing" type="CT_Spacing" minOccurs="0"/>
      <xsd:element name="ind" type="CT_Ind" minOccurs="0"/>
      <xsd:element name="contextualSpacing" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="mirrorIndents" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="suppressOverlap" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="jc" type="CT_Jc" minOccurs="0"/>
      <xsd:element name="textDirection" type="CT_TextDirection" minOccurs="0"/>
      <xsd:element name="textAlignment" type="CT_TextAlignment" minOccurs="0"/>
      <xsd:element name="textboxTightWrap" type="CT_TextboxTightWrap" minOccurs="0"/>
      <xsd:element name="outlineLvl" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="divId" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="cnfStyle" type="CT_Cnf" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_PPr">
    <xsd:complexContent>
      <xsd:extension base="CT_PPrBase">
        <xsd:sequence>
          <xsd:element name="rPr" type="CT_ParaRPr" minOccurs="0"/>
          <xsd:element name="sectPr" type="CT_SectPr" minOccurs="0"/>
          <xsd:element name="pPrChange" type="CT_PPrChange" minOccurs="0"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_PPrGeneral">
    <xsd:complexContent>
      <xsd:extension base="CT_PPrBase">
        <xsd:sequence>
          <xsd:element name="pPrChange" type="CT_PPrChange" minOccurs="0"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_Control">
    <xsd:attribute name="name" type="s:ST_String" use="optional"/>
    <xsd:attribute name="shapeid" type="s:ST_String" use="optional"/>
    <xsd:attribute ref="r:id" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Background">
    <xsd:sequence>
      <xsd:sequence maxOccurs="unbounded">
        <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:vml" minOccurs="0"
          maxOccurs="unbounded"/>
        <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:office:office"
          minOccurs="0" maxOccurs="unbounded"/>
      </xsd:sequence>
      <xsd:element name="drawing" type="CT_Drawing" minOccurs="0"/>
    </xsd:sequence>
    <xsd:attribute name="color" type="ST_HexColor" use="optional" default="auto"/>
    <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
    <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
    <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Rel">
    <xsd:attribute ref="r:id" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Object">
    <xsd:sequence>
      <xsd:sequence maxOccurs="unbounded">
        <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:vml" minOccurs="0"
          maxOccurs="unbounded"/>
        <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:office:office"
          minOccurs="0" maxOccurs="unbounded"/>
      </xsd:sequence>
      <xsd:element name="drawing" type="CT_Drawing" minOccurs="0"/>
      <xsd:choice minOccurs="0">
        <xsd:element name="control" type="CT_Control"/>
        <xsd:element name="objectLink" type="CT_ObjectLink"/>
        <xsd:element name="objectEmbed" type="CT_ObjectEmbed"/>
        <xsd:element name="movie" type="CT_Rel"/>
      </xsd:choice>
    </xsd:sequence>
    <xsd:attribute name="dxaOrig" type="s:ST_TwipsMeasure" use="optional"/>
    <xsd:attribute name="dyaOrig" type="s:ST_TwipsMeasure" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Picture">
    <xsd:sequence>
      <xsd:sequence maxOccurs="unbounded">
        <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:vml" minOccurs="0"
          maxOccurs="unbounded"/>
        <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:office:office"
          minOccurs="0" maxOccurs="unbounded"/>
      </xsd:sequence>
      <xsd:element name="movie" type="CT_Rel" minOccurs="0"/>
      <xsd:element name="control" type="CT_Control" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ObjectEmbed">
    <xsd:attribute name="drawAspect" type="ST_ObjectDrawAspect" use="optional"/>
    <xsd:attribute ref="r:id" use="required"/>
    <xsd:attribute name="progId" type="s:ST_String" use="optional"/>
    <xsd:attribute name="shapeId" type="s:ST_String" use="optional"/>
    <xsd:attribute name="fieldCodes" type="s:ST_String" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_ObjectDrawAspect">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="content"/>
      <xsd:enumeration value="icon"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_ObjectLink">
    <xsd:complexContent>
      <xsd:extension base="CT_ObjectEmbed">
        <xsd:attribute name="updateMode" type="ST_ObjectUpdateMode" use="required"/>
        <xsd:attribute name="lockedField" type="s:ST_OnOff" use="optional"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:simpleType name="ST_ObjectUpdateMode">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="always"/>
      <xsd:enumeration value="onCall"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Drawing">
    <xsd:choice minOccurs="1" maxOccurs="unbounded">
      <xsd:element ref="wp:anchor" minOccurs="0"/>
      <xsd:element ref="wp:inline" minOccurs="0"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:complexType name="CT_SimpleField">
    <xsd:sequence>
      <xsd:element name="fldData" type="CT_Text" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="instr" type="s:ST_String" use="required"/>
    <xsd:attribute name="fldLock" type="s:ST_OnOff"/>
    <xsd:attribute name="dirty" type="s:ST_OnOff"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_FldCharType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="begin"/>
      <xsd:enumeration value="separate"/>
      <xsd:enumeration value="end"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_InfoTextType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="text"/>
      <xsd:enumeration value="autoText"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FFHelpTextVal">
    <xsd:restriction base="xsd:string">
      <xsd:maxLength value="256"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FFStatusTextVal">
    <xsd:restriction base="xsd:string">
      <xsd:maxLength value="140"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FFName">
    <xsd:restriction base="xsd:string">
      <xsd:maxLength value="65"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FFTextType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="regular"/>
      <xsd:enumeration value="number"/>
      <xsd:enumeration value="date"/>
      <xsd:enumeration value="currentTime"/>
      <xsd:enumeration value="currentDate"/>
      <xsd:enumeration value="calculated"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_FFTextType">
    <xsd:attribute name="val" type="ST_FFTextType" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FFName">
    <xsd:attribute name="val" type="ST_FFName"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FldChar">
    <xsd:choice>
      <xsd:element name="fldData" type="CT_Text" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="ffData" type="CT_FFData" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="numberingChange" type="CT_TrackChangeNumbering" minOccurs="0"/>
    </xsd:choice>
    <xsd:attribute name="fldCharType" type="ST_FldCharType" use="required"/>
    <xsd:attribute name="fldLock" type="s:ST_OnOff"/>
    <xsd:attribute name="dirty" type="s:ST_OnOff"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Hyperlink">
    <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
    <xsd:attribute name="tgtFrame" type="s:ST_String" use="optional"/>
    <xsd:attribute name="tooltip" type="s:ST_String" use="optional"/>
    <xsd:attribute name="docLocation" type="s:ST_String" use="optional"/>
    <xsd:attribute name="history" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="anchor" type="s:ST_String" use="optional"/>
    <xsd:attribute ref="r:id"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FFData">
    <xsd:choice maxOccurs="unbounded">
      <xsd:element name="name" type="CT_FFName"/>
      <xsd:element name="label" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="tabIndex" type="CT_UnsignedDecimalNumber" minOccurs="0"/>
      <xsd:element name="enabled" type="CT_OnOff"/>
      <xsd:element name="calcOnExit" type="CT_OnOff"/>
      <xsd:element name="entryMacro" type="CT_MacroName" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="exitMacro" type="CT_MacroName" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="helpText" type="CT_FFHelpText" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="statusText" type="CT_FFStatusText" minOccurs="0" maxOccurs="1"/>
      <xsd:choice>
        <xsd:element name="checkBox" type="CT_FFCheckBox"/>
        <xsd:element name="ddList" type="CT_FFDDList"/>
        <xsd:element name="textInput" type="CT_FFTextInput"/>
      </xsd:choice>
    </xsd:choice>
  </xsd:complexType>
  <xsd:complexType name="CT_FFHelpText">
    <xsd:attribute name="type" type="ST_InfoTextType"/>
    <xsd:attribute name="val" type="ST_FFHelpTextVal"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FFStatusText">
    <xsd:attribute name="type" type="ST_InfoTextType"/>
    <xsd:attribute name="val" type="ST_FFStatusTextVal"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FFCheckBox">
    <xsd:sequence>
      <xsd:choice>
        <xsd:element name="size" type="CT_HpsMeasure"/>
        <xsd:element name="sizeAuto" type="CT_OnOff"/>
      </xsd:choice>
      <xsd:element name="default" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="checked" type="CT_OnOff" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_FFDDList">
    <xsd:sequence>
      <xsd:element name="result" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="default" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="listEntry" type="CT_String" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_FFTextInput">
    <xsd:sequence>
      <xsd:element name="type" type="CT_FFTextType" minOccurs="0"/>
      <xsd:element name="default" type="CT_String" minOccurs="0"/>
      <xsd:element name="maxLength" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="format" type="CT_String" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_SectionMark">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="nextPage"/>
      <xsd:enumeration value="nextColumn"/>
      <xsd:enumeration value="continuous"/>
      <xsd:enumeration value="evenPage"/>
      <xsd:enumeration value="oddPage"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_SectType">
    <xsd:attribute name="val" type="ST_SectionMark"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PaperSource">
    <xsd:attribute name="first" type="ST_DecimalNumber"/>
    <xsd:attribute name="other" type="ST_DecimalNumber"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_NumberFormat">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="decimal"/>
      <xsd:enumeration value="upperRoman"/>
      <xsd:enumeration value="lowerRoman"/>
      <xsd:enumeration value="upperLetter"/>
      <xsd:enumeration value="lowerLetter"/>
      <xsd:enumeration value="ordinal"/>
      <xsd:enumeration value="cardinalText"/>
      <xsd:enumeration value="ordinalText"/>
      <xsd:enumeration value="hex"/>
      <xsd:enumeration value="chicago"/>
      <xsd:enumeration value="ideographDigital"/>
      <xsd:enumeration value="japaneseCounting"/>
      <xsd:enumeration value="aiueo"/>
      <xsd:enumeration value="iroha"/>
      <xsd:enumeration value="decimalFullWidth"/>
      <xsd:enumeration value="decimalHalfWidth"/>
      <xsd:enumeration value="japaneseLegal"/>
      <xsd:enumeration value="japaneseDigitalTenThousand"/>
      <xsd:enumeration value="decimalEnclosedCircle"/>
      <xsd:enumeration value="decimalFullWidth2"/>
      <xsd:enumeration value="aiueoFullWidth"/>
      <xsd:enumeration value="irohaFullWidth"/>
      <xsd:enumeration value="decimalZero"/>
      <xsd:enumeration value="bullet"/>
      <xsd:enumeration value="ganada"/>
      <xsd:enumeration value="chosung"/>
      <xsd:enumeration value="decimalEnclosedFullstop"/>
      <xsd:enumeration value="decimalEnclosedParen"/>
      <xsd:enumeration value="decimalEnclosedCircleChinese"/>
      <xsd:enumeration value="ideographEnclosedCircle"/>
      <xsd:enumeration value="ideographTraditional"/>
      <xsd:enumeration value="ideographZodiac"/>
      <xsd:enumeration value="ideographZodiacTraditional"/>
      <xsd:enumeration value="taiwaneseCounting"/>
      <xsd:enumeration value="ideographLegalTraditional"/>
      <xsd:enumeration value="taiwaneseCountingThousand"/>
      <xsd:enumeration value="taiwaneseDigital"/>
      <xsd:enumeration value="chineseCounting"/>
      <xsd:enumeration value="chineseLegalSimplified"/>
      <xsd:enumeration value="chineseCountingThousand"/>
      <xsd:enumeration value="koreanDigital"/>
      <xsd:enumeration value="koreanCounting"/>
      <xsd:enumeration value="koreanLegal"/>
      <xsd:enumeration value="koreanDigital2"/>
      <xsd:enumeration value="vietnameseCounting"/>
      <xsd:enumeration value="russianLower"/>
      <xsd:enumeration value="russianUpper"/>
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="numberInDash"/>
      <xsd:enumeration value="hebrew1"/>
      <xsd:enumeration value="hebrew2"/>
      <xsd:enumeration value="arabicAlpha"/>
      <xsd:enumeration value="arabicAbjad"/>
      <xsd:enumeration value="hindiVowels"/>
      <xsd:enumeration value="hindiConsonants"/>
      <xsd:enumeration value="hindiNumbers"/>
      <xsd:enumeration value="hindiCounting"/>
      <xsd:enumeration value="thaiLetters"/>
      <xsd:enumeration value="thaiNumbers"/>
      <xsd:enumeration value="thaiCounting"/>
      <xsd:enumeration value="bahtText"/>
      <xsd:enumeration value="dollarText"/>
      <xsd:enumeration value="custom"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PageOrientation">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="portrait"/>
      <xsd:enumeration value="landscape"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PageSz">
    <xsd:attribute name="w" type="s:ST_TwipsMeasure"/>
    <xsd:attribute name="h" type="s:ST_TwipsMeasure"/>
    <xsd:attribute name="orient" type="ST_PageOrientation" use="optional"/>
    <xsd:attribute name="code" type="ST_DecimalNumber" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PageMar">
    <xsd:attribute name="top" type="ST_SignedTwipsMeasure" use="required"/>
    <xsd:attribute name="right" type="s:ST_TwipsMeasure" use="required"/>
    <xsd:attribute name="bottom" type="ST_SignedTwipsMeasure" use="required"/>
    <xsd:attribute name="left" type="s:ST_TwipsMeasure" use="required"/>
    <xsd:attribute name="header" type="s:ST_TwipsMeasure" use="required"/>
    <xsd:attribute name="footer" type="s:ST_TwipsMeasure" use="required"/>
    <xsd:attribute name="gutter" type="s:ST_TwipsMeasure" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PageBorderZOrder">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="front"/>
      <xsd:enumeration value="back"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PageBorderDisplay">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="allPages"/>
      <xsd:enumeration value="firstPage"/>
      <xsd:enumeration value="notFirstPage"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PageBorderOffset">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="page"/>
      <xsd:enumeration value="text"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PageBorders">
    <xsd:sequence>
      <xsd:element name="top" type="CT_TopPageBorder" minOccurs="0"/>
      <xsd:element name="left" type="CT_PageBorder" minOccurs="0"/>
      <xsd:element name="bottom" type="CT_BottomPageBorder" minOccurs="0"/>
      <xsd:element name="right" type="CT_PageBorder" minOccurs="0"/>
    </xsd:sequence>
    <xsd:attribute name="zOrder" type="ST_PageBorderZOrder" use="optional" default="front"/>
    <xsd:attribute name="display" type="ST_PageBorderDisplay" use="optional"/>
    <xsd:attribute name="offsetFrom" type="ST_PageBorderOffset" use="optional" default="text"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PageBorder">
    <xsd:complexContent>
      <xsd:extension base="CT_Border">
        <xsd:attribute ref="r:id" use="optional"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_BottomPageBorder">
    <xsd:complexContent>
      <xsd:extension base="CT_PageBorder">
        <xsd:attribute ref="r:bottomLeft" use="optional"/>
        <xsd:attribute ref="r:bottomRight" use="optional"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_TopPageBorder">
    <xsd:complexContent>
      <xsd:extension base="CT_PageBorder">
        <xsd:attribute ref="r:topLeft" use="optional"/>
        <xsd:attribute ref="r:topRight" use="optional"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:simpleType name="ST_ChapterSep">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="hyphen"/>
      <xsd:enumeration value="period"/>
      <xsd:enumeration value="colon"/>
      <xsd:enumeration value="emDash"/>
      <xsd:enumeration value="enDash"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_LineNumberRestart">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="newPage"/>
      <xsd:enumeration value="newSection"/>
      <xsd:enumeration value="continuous"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_LineNumber">
    <xsd:attribute name="countBy" type="ST_DecimalNumber" use="optional"/>
    <xsd:attribute name="start" type="ST_DecimalNumber" use="optional" default="1"/>
    <xsd:attribute name="distance" type="s:ST_TwipsMeasure" use="optional"/>
    <xsd:attribute name="restart" type="ST_LineNumberRestart" use="optional" default="newPage"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PageNumber">
    <xsd:attribute name="fmt" type="ST_NumberFormat" use="optional" default="decimal"/>
    <xsd:attribute name="start" type="ST_DecimalNumber" use="optional"/>
    <xsd:attribute name="chapStyle" type="ST_DecimalNumber" use="optional"/>
    <xsd:attribute name="chapSep" type="ST_ChapterSep" use="optional" default="hyphen"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Column">
    <xsd:attribute name="w" type="s:ST_TwipsMeasure" use="optional"/>
    <xsd:attribute name="space" type="s:ST_TwipsMeasure" use="optional" default="0"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Columns">
    <xsd:sequence minOccurs="0">
      <xsd:element name="col" type="CT_Column" maxOccurs="45"/>
    </xsd:sequence>
    <xsd:attribute name="equalWidth" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="space" type="s:ST_TwipsMeasure" use="optional" default="720"/>
    <xsd:attribute name="num" type="ST_DecimalNumber" use="optional" default="1"/>
    <xsd:attribute name="sep" type="s:ST_OnOff" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_VerticalJc">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="top"/>
      <xsd:enumeration value="center"/>
      <xsd:enumeration value="both"/>
      <xsd:enumeration value="bottom"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_VerticalJc">
    <xsd:attribute name="val" type="ST_VerticalJc" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DocGrid">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="default"/>
      <xsd:enumeration value="lines"/>
      <xsd:enumeration value="linesAndChars"/>
      <xsd:enumeration value="snapToChars"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_DocGrid">
    <xsd:attribute name="type" type="ST_DocGrid"/>
    <xsd:attribute name="linePitch" type="ST_DecimalNumber"/>
    <xsd:attribute name="charSpace" type="ST_DecimalNumber"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_HdrFtr">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="even"/>
      <xsd:enumeration value="default"/>
      <xsd:enumeration value="first"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_FtnEdn">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="normal"/>
      <xsd:enumeration value="separator"/>
      <xsd:enumeration value="continuationSeparator"/>
      <xsd:enumeration value="continuationNotice"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_HdrFtrRef">
    <xsd:complexContent>
      <xsd:extension base="CT_Rel">
        <xsd:attribute name="type" type="ST_HdrFtr" use="required"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:group name="EG_HdrFtrReferences">
    <xsd:choice>
      <xsd:element name="headerReference" type="CT_HdrFtrRef" minOccurs="0"/>
      <xsd:element name="footerReference" type="CT_HdrFtrRef" minOccurs="0"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_HdrFtr">
    <xsd:group ref="EG_BlockLevelElts" minOccurs="1" maxOccurs="unbounded"/>
  </xsd:complexType>
  <xsd:group name="EG_SectPrContents">
    <xsd:sequence>
      <xsd:element name="footnotePr" type="CT_FtnProps" minOccurs="0"/>
      <xsd:element name="endnotePr" type="CT_EdnProps" minOccurs="0"/>
      <xsd:element name="type" type="CT_SectType" minOccurs="0"/>
      <xsd:element name="pgSz" type="CT_PageSz" minOccurs="0"/>
      <xsd:element name="pgMar" type="CT_PageMar" minOccurs="0"/>
      <xsd:element name="paperSrc" type="CT_PaperSource" minOccurs="0"/>
      <xsd:element name="pgBorders" type="CT_PageBorders" minOccurs="0"/>
      <xsd:element name="lnNumType" type="CT_LineNumber" minOccurs="0"/>
      <xsd:element name="pgNumType" type="CT_PageNumber" minOccurs="0"/>
      <xsd:element name="cols" type="CT_Columns" minOccurs="0"/>
      <xsd:element name="formProt" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="vAlign" type="CT_VerticalJc" minOccurs="0"/>
      <xsd:element name="noEndnote" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="titlePg" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="textDirection" type="CT_TextDirection" minOccurs="0"/>
      <xsd:element name="bidi" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="rtlGutter" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="docGrid" type="CT_DocGrid" minOccurs="0"/>
      <xsd:element name="printerSettings" type="CT_Rel" minOccurs="0"/>
    </xsd:sequence>
  </xsd:group>
  <xsd:attributeGroup name="AG_SectPrAttributes">
    <xsd:attribute name="rsidRPr" type="ST_LongHexNumber"/>
    <xsd:attribute name="rsidDel" type="ST_LongHexNumber"/>
    <xsd:attribute name="rsidR" type="ST_LongHexNumber"/>
    <xsd:attribute name="rsidSect" type="ST_LongHexNumber"/>
  </xsd:attributeGroup>
  <xsd:complexType name="CT_SectPrBase">
    <xsd:sequence>
      <xsd:group ref="EG_SectPrContents" minOccurs="0"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_SectPrAttributes"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SectPr">
    <xsd:sequence>
      <xsd:group ref="EG_HdrFtrReferences" minOccurs="0" maxOccurs="6"/>
      <xsd:group ref="EG_SectPrContents" minOccurs="0"/>
      <xsd:element name="sectPrChange" type="CT_SectPrChange" minOccurs="0"/>
    </xsd:sequence>
    <xsd:attributeGroup ref="AG_SectPrAttributes"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_BrType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="page"/>
      <xsd:enumeration value="column"/>
      <xsd:enumeration value="textWrapping"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_BrClear">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="left"/>
      <xsd:enumeration value="right"/>
      <xsd:enumeration value="all"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Br">
    <xsd:attribute name="type" type="ST_BrType" use="optional"/>
    <xsd:attribute name="clear" type="ST_BrClear" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_PTabAlignment">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="left"/>
      <xsd:enumeration value="center"/>
      <xsd:enumeration value="right"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PTabRelativeTo">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="margin"/>
      <xsd:enumeration value="indent"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_PTabLeader">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="dot"/>
      <xsd:enumeration value="hyphen"/>
      <xsd:enumeration value="underscore"/>
      <xsd:enumeration value="middleDot"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_PTab">
    <xsd:attribute name="alignment" type="ST_PTabAlignment" use="required"/>
    <xsd:attribute name="relativeTo" type="ST_PTabRelativeTo" use="required"/>
    <xsd:attribute name="leader" type="ST_PTabLeader" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Sym">
    <xsd:attribute name="font" type="s:ST_String"/>
    <xsd:attribute name="char" type="ST_ShortHexNumber"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_ProofErr">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="spellStart"/>
      <xsd:enumeration value="spellEnd"/>
      <xsd:enumeration value="gramStart"/>
      <xsd:enumeration value="gramEnd"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_ProofErr">
    <xsd:attribute name="type" type="ST_ProofErr" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_EdGrp">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="everyone"/>
      <xsd:enumeration value="administrators"/>
      <xsd:enumeration value="contributors"/>
      <xsd:enumeration value="editors"/>
      <xsd:enumeration value="owners"/>
      <xsd:enumeration value="current"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Perm">
    <xsd:attribute name="id" type="s:ST_String" use="required"/>
    <xsd:attribute name="displacedByCustomXml" type="ST_DisplacedByCustomXml" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_PermStart">
    <xsd:complexContent>
      <xsd:extension base="CT_Perm">
        <xsd:attribute name="edGrp" type="ST_EdGrp" use="optional"/>
        <xsd:attribute name="ed" type="s:ST_String" use="optional"/>
        <xsd:attribute name="colFirst" type="ST_DecimalNumber" use="optional"/>
        <xsd:attribute name="colLast" type="ST_DecimalNumber" use="optional"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_Text">
    <xsd:simpleContent>
      <xsd:extension base="s:ST_String">
        <xsd:attribute ref="xml:space" use="optional"/>
      </xsd:extension>
    </xsd:simpleContent>
  </xsd:complexType>
  <xsd:group name="EG_RunInnerContent">
    <xsd:choice>
      <xsd:element name="br" type="CT_Br"/>
      <xsd:element name="t" type="CT_Text"/>
      <xsd:element name="contentPart" type="CT_Rel"/>
      <xsd:element name="delText" type="CT_Text"/>
      <xsd:element name="instrText" type="CT_Text"/>
      <xsd:element name="delInstrText" type="CT_Text"/>
      <xsd:element name="noBreakHyphen" type="CT_Empty"/>
      <xsd:element name="softHyphen" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="dayShort" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="monthShort" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="yearShort" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="dayLong" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="monthLong" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="yearLong" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="annotationRef" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="footnoteRef" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="endnoteRef" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="separator" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="continuationSeparator" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="sym" type="CT_Sym" minOccurs="0"/>
      <xsd:element name="pgNum" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="cr" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="tab" type="CT_Empty" minOccurs="0"/>
      <xsd:element name="object" type="CT_Object"/>
      <xsd:element name="pict" type="CT_Picture"/>
      <xsd:element name="fldChar" type="CT_FldChar"/>
      <xsd:element name="ruby" type="CT_Ruby"/>
      <xsd:element name="footnoteReference" type="CT_FtnEdnRef"/>
      <xsd:element name="endnoteReference" type="CT_FtnEdnRef"/>
      <xsd:element name="commentReference" type="CT_Markup"/>
      <xsd:element name="drawing" type="CT_Drawing"/>
      <xsd:element name="ptab" type="CT_PTab" minOccurs="0"/>
      <xsd:element name="lastRenderedPageBreak" type="CT_Empty" minOccurs="0" maxOccurs="1"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_R">
    <xsd:sequence>
      <xsd:group ref="EG_RPr" minOccurs="0"/>
      <xsd:group ref="EG_RunInnerContent" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="rsidRPr" type="ST_LongHexNumber"/>
    <xsd:attribute name="rsidDel" type="ST_LongHexNumber"/>
    <xsd:attribute name="rsidR" type="ST_LongHexNumber"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Hint">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="default"/>
      <xsd:enumeration value="eastAsia"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_Theme">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="majorEastAsia"/>
      <xsd:enumeration value="majorBidi"/>
      <xsd:enumeration value="majorAscii"/>
      <xsd:enumeration value="majorHAnsi"/>
      <xsd:enumeration value="minorEastAsia"/>
      <xsd:enumeration value="minorBidi"/>
      <xsd:enumeration value="minorAscii"/>
      <xsd:enumeration value="minorHAnsi"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Fonts">
    <xsd:attribute name="hint" type="ST_Hint"/>
    <xsd:attribute name="ascii" type="s:ST_String"/>
    <xsd:attribute name="hAnsi" type="s:ST_String"/>
    <xsd:attribute name="eastAsia" type="s:ST_String"/>
    <xsd:attribute name="cs" type="s:ST_String"/>
    <xsd:attribute name="asciiTheme" type="ST_Theme"/>
    <xsd:attribute name="hAnsiTheme" type="ST_Theme"/>
    <xsd:attribute name="eastAsiaTheme" type="ST_Theme"/>
    <xsd:attribute name="cstheme" type="ST_Theme"/>
  </xsd:complexType>
  <xsd:group name="EG_RPrBase">
    <xsd:choice>
      <xsd:element name="rStyle" type="CT_String"/>
      <xsd:element name="rFonts" type="CT_Fonts"/>
      <xsd:element name="b" type="CT_OnOff"/>
      <xsd:element name="bCs" type="CT_OnOff"/>
      <xsd:element name="i" type="CT_OnOff"/>
      <xsd:element name="iCs" type="CT_OnOff"/>
      <xsd:element name="caps" type="CT_OnOff"/>
      <xsd:element name="smallCaps" type="CT_OnOff"/>
      <xsd:element name="strike" type="CT_OnOff"/>
      <xsd:element name="dstrike" type="CT_OnOff"/>
      <xsd:element name="outline" type="CT_OnOff"/>
      <xsd:element name="shadow" type="CT_OnOff"/>
      <xsd:element name="emboss" type="CT_OnOff"/>
      <xsd:element name="imprint" type="CT_OnOff"/>
      <xsd:element name="noProof" type="CT_OnOff"/>
      <xsd:element name="snapToGrid" type="CT_OnOff"/>
      <xsd:element name="vanish" type="CT_OnOff"/>
      <xsd:element name="webHidden" type="CT_OnOff"/>
      <xsd:element name="color" type="CT_Color"/>
      <xsd:element name="spacing" type="CT_SignedTwipsMeasure"/>
      <xsd:element name="w" type="CT_TextScale"/>
      <xsd:element name="kern" type="CT_HpsMeasure"/>
      <xsd:element name="position" type="CT_SignedHpsMeasure"/>
      <xsd:element name="sz" type="CT_HpsMeasure"/>
      <xsd:element name="szCs" type="CT_HpsMeasure"/>
      <xsd:element name="highlight" type="CT_Highlight"/>
      <xsd:element name="u" type="CT_Underline"/>
      <xsd:element name="effect" type="CT_TextEffect"/>
      <xsd:element name="bdr" type="CT_Border"/>
      <xsd:element name="shd" type="CT_Shd"/>
      <xsd:element name="fitText" type="CT_FitText"/>
      <xsd:element name="vertAlign" type="CT_VerticalAlignRun"/>
      <xsd:element name="rtl" type="CT_OnOff"/>
      <xsd:element name="cs" type="CT_OnOff"/>
      <xsd:element name="em" type="CT_Em"/>
      <xsd:element name="lang" type="CT_Language"/>
      <xsd:element name="eastAsianLayout" type="CT_EastAsianLayout"/>
      <xsd:element name="specVanish" type="CT_OnOff"/>
      <xsd:element name="oMath" type="CT_OnOff"/>
    </xsd:choice>
  </xsd:group>
  <xsd:group name="EG_RPrContent">
    <xsd:sequence>
      <xsd:group ref="EG_RPrBase" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rPrChange" type="CT_RPrChange" minOccurs="0"/>
    </xsd:sequence>
  </xsd:group>
  <xsd:complexType name="CT_RPr">
    <xsd:sequence>
      <xsd:group ref="EG_RPrContent" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:group name="EG_RPr">
    <xsd:sequence>
      <xsd:element name="rPr" type="CT_RPr" minOccurs="0"/>
    </xsd:sequence>
  </xsd:group>
  <xsd:group name="EG_RPrMath">
    <xsd:choice>
      <xsd:group ref="EG_RPr"/>
      <xsd:element name="ins" type="CT_MathCtrlIns"/>
      <xsd:element name="del" type="CT_MathCtrlDel"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_MathCtrlIns">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:choice minOccurs="0">
          <xsd:element name="del" type="CT_RPrChange" minOccurs="1"/>
          <xsd:element name="rPr" type="CT_RPr" minOccurs="1"/>
        </xsd:choice>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_MathCtrlDel">
    <xsd:complexContent>
      <xsd:extension base="CT_TrackChange">
        <xsd:choice minOccurs="0">
          <xsd:element name="rPr" type="CT_RPr" minOccurs="1"/>
        </xsd:choice>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_RPrOriginal">
    <xsd:sequence>
      <xsd:group ref="EG_RPrBase" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ParaRPrOriginal">
    <xsd:sequence>
      <xsd:group ref="EG_ParaRPrTrackChanges" minOccurs="0"/>
      <xsd:group ref="EG_RPrBase" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ParaRPr">
    <xsd:sequence>
      <xsd:group ref="EG_ParaRPrTrackChanges" minOccurs="0"/>
      <xsd:group ref="EG_RPrBase" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="rPrChange" type="CT_ParaRPrChange" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:group name="EG_ParaRPrTrackChanges">
    <xsd:sequence>
      <xsd:element name="ins" type="CT_TrackChange" minOccurs="0"/>
      <xsd:element name="del" type="CT_TrackChange" minOccurs="0"/>
      <xsd:element name="moveFrom" type="CT_TrackChange" minOccurs="0"/>
      <xsd:element name="moveTo" type="CT_TrackChange" minOccurs="0"/>
    </xsd:sequence>
  </xsd:group>
  <xsd:complexType name="CT_AltChunk">
    <xsd:sequence>
      <xsd:element name="altChunkPr" type="CT_AltChunkPr" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute ref="r:id" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AltChunkPr">
    <xsd:sequence>
      <xsd:element name="matchSrc" type="CT_OnOff" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_RubyAlign">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="center"/>
      <xsd:enumeration value="distributeLetter"/>
      <xsd:enumeration value="distributeSpace"/>
      <xsd:enumeration value="left"/>
      <xsd:enumeration value="right"/>
      <xsd:enumeration value="rightVertical"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_RubyAlign">
    <xsd:attribute name="val" type="ST_RubyAlign" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RubyPr">
    <xsd:sequence>
      <xsd:element name="rubyAlign" type="CT_RubyAlign"/>
      <xsd:element name="hps" type="CT_HpsMeasure"/>
      <xsd:element name="hpsRaise" type="CT_HpsMeasure"/>
      <xsd:element name="hpsBaseText" type="CT_HpsMeasure"/>
      <xsd:element name="lid" type="CT_Lang"/>
      <xsd:element name="dirty" type="CT_OnOff" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:group name="EG_RubyContent">
    <xsd:choice>
      <xsd:element name="r" type="CT_R"/>
      <xsd:group ref="EG_RunLevelElts" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_RubyContent">
    <xsd:group ref="EG_RubyContent" minOccurs="0" maxOccurs="unbounded"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Ruby">
    <xsd:sequence>
      <xsd:element name="rubyPr" type="CT_RubyPr"/>
      <xsd:element name="rt" type="CT_RubyContent"/>
      <xsd:element name="rubyBase" type="CT_RubyContent"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_Lock">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="sdtLocked"/>
      <xsd:enumeration value="contentLocked"/>
      <xsd:enumeration value="unlocked"/>
      <xsd:enumeration value="sdtContentLocked"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Lock">
    <xsd:attribute name="val" type="ST_Lock"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SdtListItem">
    <xsd:attribute name="displayText" type="s:ST_String"/>
    <xsd:attribute name="value" type="s:ST_String"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_SdtDateMappingType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="text"/>
      <xsd:enumeration value="date"/>
      <xsd:enumeration value="dateTime"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_SdtDateMappingType">
    <xsd:attribute name="val" type="ST_SdtDateMappingType"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CalendarType">
    <xsd:attribute name="val" type="s:ST_CalendarType"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SdtDate">
    <xsd:sequence>
      <xsd:element name="dateFormat" type="CT_String" minOccurs="0"/>
      <xsd:element name="lid" type="CT_Lang" minOccurs="0"/>
      <xsd:element name="storeMappedDataAs" type="CT_SdtDateMappingType" minOccurs="0"/>
      <xsd:element name="calendar" type="CT_CalendarType" minOccurs="0"/>
    </xsd:sequence>
    <xsd:attribute name="fullDate" type="ST_DateTime" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SdtComboBox">
    <xsd:sequence>
      <xsd:element name="listItem" type="CT_SdtListItem" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="lastValue" type="s:ST_String" use="optional" default=""/>
  </xsd:complexType>
  <xsd:complexType name="CT_SdtDocPart">
    <xsd:sequence>
      <xsd:element name="docPartGallery" type="CT_String" minOccurs="0"/>
      <xsd:element name="docPartCategory" type="CT_String" minOccurs="0"/>
      <xsd:element name="docPartUnique" type="CT_OnOff" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_SdtDropDownList">
    <xsd:sequence>
      <xsd:element name="listItem" type="CT_SdtListItem" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="lastValue" type="s:ST_String" use="optional" default=""/>
  </xsd:complexType>
  <xsd:complexType name="CT_Placeholder">
    <xsd:sequence>
      <xsd:element name="docPart" type="CT_String"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_SdtText">
    <xsd:attribute name="multiLine" type="s:ST_OnOff"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DataBinding">
    <xsd:attribute name="prefixMappings" type="s:ST_String"/>
    <xsd:attribute name="xpath" type="s:ST_String" use="required"/>
    <xsd:attribute name="storeItemID" type="s:ST_String" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SdtPr">
    <xsd:sequence>
      <xsd:element name="rPr" type="CT_RPr" minOccurs="0"/>
      <xsd:element name="alias" type="CT_String" minOccurs="0"/>
      <xsd:element name="tag" type="CT_String" minOccurs="0"/>
      <xsd:element name="id" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="lock" type="CT_Lock" minOccurs="0"/>
      <xsd:element name="placeholder" type="CT_Placeholder" minOccurs="0"/>
      <xsd:element name="temporary" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="showingPlcHdr" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="dataBinding" type="CT_DataBinding" minOccurs="0"/>
      <xsd:element name="label" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="tabIndex" type="CT_UnsignedDecimalNumber" minOccurs="0"/>
      <xsd:choice minOccurs="0" maxOccurs="1">
        <xsd:element name="equation" type="CT_Empty"/>
        <xsd:element name="comboBox" type="CT_SdtComboBox"/>
        <xsd:element name="date" type="CT_SdtDate"/>
        <xsd:element name="docPartObj" type="CT_SdtDocPart"/>
        <xsd:element name="docPartList" type="CT_SdtDocPart"/>
        <xsd:element name="dropDownList" type="CT_SdtDropDownList"/>
        <xsd:element name="picture" type="CT_Empty"/>
        <xsd:element name="richText" type="CT_Empty"/>
        <xsd:element name="text" type="CT_SdtText"/>
        <xsd:element name="citation" type="CT_Empty"/>
        <xsd:element name="group" type="CT_Empty"/>
        <xsd:element name="bibliography" type="CT_Empty"/>
      </xsd:choice>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_SdtEndPr">
    <xsd:choice maxOccurs="unbounded">
      <xsd:element name="rPr" type="CT_RPr" minOccurs="0"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:group name="EG_ContentRunContent">
    <xsd:choice>
      <xsd:element name="customXml" type="CT_CustomXmlRun"/>
      <xsd:element name="smartTag" type="CT_SmartTagRun"/>
      <xsd:element name="sdt" type="CT_SdtRun"/>
      <xsd:element name="dir" type="CT_DirContentRun"/>
      <xsd:element name="bdo" type="CT_BdoContentRun"/>
      <xsd:element name="r" type="CT_R"/>
      <xsd:group ref="EG_RunLevelElts" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_DirContentRun">
    <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
    <xsd:attribute name="val" type="ST_Direction" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_BdoContentRun">
    <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
    <xsd:attribute name="val" type="ST_Direction" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Direction">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="ltr"/>
      <xsd:enumeration value="rtl"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_SdtContentRun">
    <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
  </xsd:complexType>
  <xsd:group name="EG_ContentBlockContent">
    <xsd:choice>
      <xsd:element name="customXml" type="CT_CustomXmlBlock"/>
      <xsd:element name="sdt" type="CT_SdtBlock"/>
      <xsd:element name="p" type="CT_P" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="tbl" type="CT_Tbl" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:group ref="EG_RunLevelElts" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_SdtContentBlock">
    <xsd:group ref="EG_ContentBlockContent" minOccurs="0" maxOccurs="unbounded"/>
  </xsd:complexType>
  <xsd:group name="EG_ContentRowContent">
    <xsd:choice>
      <xsd:element name="tr" type="CT_Row" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="customXml" type="CT_CustomXmlRow"/>
      <xsd:element name="sdt" type="CT_SdtRow"/>
      <xsd:group ref="EG_RunLevelElts" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_SdtContentRow">
    <xsd:group ref="EG_ContentRowContent" minOccurs="0" maxOccurs="unbounded"/>
  </xsd:complexType>
  <xsd:group name="EG_ContentCellContent">
    <xsd:choice>
      <xsd:element name="tc" type="CT_Tc" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="customXml" type="CT_CustomXmlCell"/>
      <xsd:element name="sdt" type="CT_SdtCell"/>
      <xsd:group ref="EG_RunLevelElts" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_SdtContentCell">
    <xsd:group ref="EG_ContentCellContent" minOccurs="0" maxOccurs="unbounded"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SdtBlock">
    <xsd:sequence>
      <xsd:element name="sdtPr" type="CT_SdtPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sdtEndPr" type="CT_SdtEndPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sdtContent" type="CT_SdtContentBlock" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_SdtRun">
    <xsd:sequence>
      <xsd:element name="sdtPr" type="CT_SdtPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sdtEndPr" type="CT_SdtEndPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sdtContent" type="CT_SdtContentRun" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_SdtCell">
    <xsd:sequence>
      <xsd:element name="sdtPr" type="CT_SdtPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sdtEndPr" type="CT_SdtEndPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sdtContent" type="CT_SdtContentCell" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_SdtRow">
    <xsd:sequence>
      <xsd:element name="sdtPr" type="CT_SdtPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sdtEndPr" type="CT_SdtEndPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sdtContent" type="CT_SdtContentRow" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Attr">
    <xsd:attribute name="uri" type="s:ST_String"/>
    <xsd:attribute name="name" type="s:ST_String" use="required"/>
    <xsd:attribute name="val" type="s:ST_String" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomXmlRun">
    <xsd:sequence>
      <xsd:element name="customXmlPr" type="CT_CustomXmlPr" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="uri" type="s:ST_String"/>
    <xsd:attribute name="element" type="s:ST_XmlName" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SmartTagRun">
    <xsd:sequence>
      <xsd:element name="smartTagPr" type="CT_SmartTagPr" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="uri" type="s:ST_String"/>
    <xsd:attribute name="element" type="s:ST_XmlName" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomXmlBlock">
    <xsd:sequence>
      <xsd:element name="customXmlPr" type="CT_CustomXmlPr" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_ContentBlockContent" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="uri" type="s:ST_String"/>
    <xsd:attribute name="element" type="s:ST_XmlName" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomXmlPr">
    <xsd:sequence>
      <xsd:element name="placeholder" type="CT_String" minOccurs="0"/>
      <xsd:element name="attr" type="CT_Attr" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomXmlRow">
    <xsd:sequence>
      <xsd:element name="customXmlPr" type="CT_CustomXmlPr" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_ContentRowContent" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="uri" type="s:ST_String"/>
    <xsd:attribute name="element" type="s:ST_XmlName" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_CustomXmlCell">
    <xsd:sequence>
      <xsd:element name="customXmlPr" type="CT_CustomXmlPr" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_ContentCellContent" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="uri" type="s:ST_String"/>
    <xsd:attribute name="element" type="s:ST_XmlName" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SmartTagPr">
    <xsd:sequence>
      <xsd:element name="attr" type="CT_Attr" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:group name="EG_PContent">
    <xsd:choice>
      <xsd:group ref="EG_ContentRunContent" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="fldSimple" type="CT_SimpleField" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="hyperlink" type="CT_Hyperlink"/>
      <xsd:element name="subDoc" type="CT_Rel"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_P">
    <xsd:sequence>
      <xsd:element name="pPr" type="CT_PPr" minOccurs="0"/>
      <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="rsidRPr" type="ST_LongHexNumber"/>
    <xsd:attribute name="rsidR" type="ST_LongHexNumber"/>
    <xsd:attribute name="rsidDel" type="ST_LongHexNumber"/>
    <xsd:attribute name="rsidP" type="ST_LongHexNumber"/>
    <xsd:attribute name="rsidRDefault" type="ST_LongHexNumber"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TblWidth">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="nil"/>
      <xsd:enumeration value="pct"/>
      <xsd:enumeration value="dxa"/>
      <xsd:enumeration value="auto"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Height">
    <xsd:attribute name="val" type="s:ST_TwipsMeasure"/>
    <xsd:attribute name="hRule" type="ST_HeightRule"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_MeasurementOrPercent">
    <xsd:union memberTypes="ST_DecimalNumberOrPercent s:ST_UniversalMeasure"/>
  </xsd:simpleType>
  <xsd:complexType name="CT_TblWidth">
    <xsd:attribute name="w" type="ST_MeasurementOrPercent"/>
    <xsd:attribute name="type" type="ST_TblWidth"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TblGridCol">
    <xsd:attribute name="w" type="s:ST_TwipsMeasure"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TblGridBase">
    <xsd:sequence>
      <xsd:element name="gridCol" type="CT_TblGridCol" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TblGrid">
    <xsd:complexContent>
      <xsd:extension base="CT_TblGridBase">
        <xsd:sequence>
          <xsd:element name="tblGridChange" type="CT_TblGridChange" minOccurs="0"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_TcBorders">
    <xsd:sequence>
      <xsd:element name="top" type="CT_Border" minOccurs="0"/>
      <xsd:element name="start" type="CT_Border" minOccurs="0"/>
      <xsd:element name="left" type="CT_Border" minOccurs="0"/>
      <xsd:element name="bottom" type="CT_Border" minOccurs="0"/>
      <xsd:element name="end" type="CT_Border" minOccurs="0"/>
      <xsd:element name="right" type="CT_Border" minOccurs="0"/>
      <xsd:element name="insideH" type="CT_Border" minOccurs="0"/>
      <xsd:element name="insideV" type="CT_Border" minOccurs="0"/>
      <xsd:element name="tl2br" type="CT_Border" minOccurs="0"/>
      <xsd:element name="tr2bl" type="CT_Border" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TcMar">
    <xsd:sequence>
      <xsd:element name="top" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="start" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="left" type="CT_TblWidth" minOccurs="0"/>
      <xsd:element name="bottom" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="end" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="right" type="CT_TblWidth" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_Merge">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="continue"/>
      <xsd:enumeration value="restart"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_VMerge">
    <xsd:attribute name="val" type="ST_Merge"/>
  </xsd:complexType>
  <xsd:complexType name="CT_HMerge">
    <xsd:attribute name="val" type="ST_Merge"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TcPrBase">
    <xsd:sequence>
      <xsd:element name="cnfStyle" type="CT_Cnf" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tcW" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="gridSpan" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="hMerge" type="CT_HMerge" minOccurs="0"/>
      <xsd:element name="vMerge" type="CT_VMerge" minOccurs="0"/>
      <xsd:element name="tcBorders" type="CT_TcBorders" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="shd" type="CT_Shd" minOccurs="0"/>
      <xsd:element name="noWrap" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="tcMar" type="CT_TcMar" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="textDirection" type="CT_TextDirection" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tcFitText" type="CT_OnOff" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="vAlign" type="CT_VerticalJc" minOccurs="0"/>
      <xsd:element name="hideMark" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="headers" type="CT_Headers" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TcPr">
    <xsd:complexContent>
      <xsd:extension base="CT_TcPrInner">
        <xsd:sequence>
          <xsd:element name="tcPrChange" type="CT_TcPrChange" minOccurs="0"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_TcPrInner">
    <xsd:complexContent>
      <xsd:extension base="CT_TcPrBase">
        <xsd:sequence>
          <xsd:group ref="EG_CellMarkupElements" minOccurs="0" maxOccurs="1"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_Tc">
    <xsd:sequence>
      <xsd:element name="tcPr" type="CT_TcPr" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_BlockLevelElts" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="id" type="s:ST_String" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Cnf">
    <xsd:restriction base="xsd:string">
      <xsd:length value="12"/>
      <xsd:pattern value="[01]*"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Cnf">
    <xsd:attribute name="val" type="ST_Cnf"/>
    <xsd:attribute name="firstRow" type="s:ST_OnOff"/>
    <xsd:attribute name="lastRow" type="s:ST_OnOff"/>
    <xsd:attribute name="firstColumn" type="s:ST_OnOff"/>
    <xsd:attribute name="lastColumn" type="s:ST_OnOff"/>
    <xsd:attribute name="oddVBand" type="s:ST_OnOff"/>
    <xsd:attribute name="evenVBand" type="s:ST_OnOff"/>
    <xsd:attribute name="oddHBand" type="s:ST_OnOff"/>
    <xsd:attribute name="evenHBand" type="s:ST_OnOff"/>
    <xsd:attribute name="firstRowFirstColumn" type="s:ST_OnOff"/>
    <xsd:attribute name="firstRowLastColumn" type="s:ST_OnOff"/>
    <xsd:attribute name="lastRowFirstColumn" type="s:ST_OnOff"/>
    <xsd:attribute name="lastRowLastColumn" type="s:ST_OnOff"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Headers">
    <xsd:sequence minOccurs="0" maxOccurs="unbounded">
      <xsd:element name="header" type="CT_String"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TrPrBase">
    <xsd:choice maxOccurs="unbounded">
      <xsd:element name="cnfStyle" type="CT_Cnf" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="divId" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="gridBefore" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="gridAfter" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="wBefore" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="wAfter" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="cantSplit" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="trHeight" type="CT_Height" minOccurs="0"/>
      <xsd:element name="tblHeader" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="tblCellSpacing" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="jc" type="CT_JcTable" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="hidden" type="CT_OnOff" minOccurs="0"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:complexType name="CT_TrPr">
    <xsd:complexContent>
      <xsd:extension base="CT_TrPrBase">
        <xsd:sequence>
          <xsd:element name="ins" type="CT_TrackChange" minOccurs="0"/>
          <xsd:element name="del" type="CT_TrackChange" minOccurs="0"/>
          <xsd:element name="trPrChange" type="CT_TrPrChange" minOccurs="0"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_Row">
    <xsd:sequence>
      <xsd:element name="tblPrEx" type="CT_TblPrEx" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="trPr" type="CT_TrPr" minOccurs="0" maxOccurs="1"/>
      <xsd:group ref="EG_ContentCellContent" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="rsidRPr" type="ST_LongHexNumber"/>
    <xsd:attribute name="rsidR" type="ST_LongHexNumber"/>
    <xsd:attribute name="rsidDel" type="ST_LongHexNumber"/>
    <xsd:attribute name="rsidTr" type="ST_LongHexNumber"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TblLayoutType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="fixed"/>
      <xsd:enumeration value="autofit"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TblLayoutType">
    <xsd:attribute name="type" type="ST_TblLayoutType"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_TblOverlap">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="never"/>
      <xsd:enumeration value="overlap"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TblOverlap">
    <xsd:attribute name="val" type="ST_TblOverlap" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TblPPr">
    <xsd:attribute name="leftFromText" type="s:ST_TwipsMeasure"/>
    <xsd:attribute name="rightFromText" type="s:ST_TwipsMeasure"/>
    <xsd:attribute name="topFromText" type="s:ST_TwipsMeasure"/>
    <xsd:attribute name="bottomFromText" type="s:ST_TwipsMeasure"/>
    <xsd:attribute name="vertAnchor" type="ST_VAnchor"/>
    <xsd:attribute name="horzAnchor" type="ST_HAnchor"/>
    <xsd:attribute name="tblpXSpec" type="s:ST_XAlign"/>
    <xsd:attribute name="tblpX" type="ST_SignedTwipsMeasure"/>
    <xsd:attribute name="tblpYSpec" type="s:ST_YAlign"/>
    <xsd:attribute name="tblpY" type="ST_SignedTwipsMeasure"/>
  </xsd:complexType>
  <xsd:complexType name="CT_TblCellMar">
    <xsd:sequence>
      <xsd:element name="top" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="start" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="left" type="CT_TblWidth" minOccurs="0"/>
      <xsd:element name="bottom" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="end" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="right" type="CT_TblWidth" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TblBorders">
    <xsd:sequence>
      <xsd:element name="top" type="CT_Border" minOccurs="0"/>
      <xsd:element name="start" type="CT_Border" minOccurs="0"/>
      <xsd:element name="left" type="CT_Border" minOccurs="0"/>
      <xsd:element name="bottom" type="CT_Border" minOccurs="0"/>
      <xsd:element name="end" type="CT_Border" minOccurs="0"/>
      <xsd:element name="right" type="CT_Border" minOccurs="0"/>
      <xsd:element name="insideH" type="CT_Border" minOccurs="0"/>
      <xsd:element name="insideV" type="CT_Border" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TblPrBase">
    <xsd:sequence>
      <xsd:element name="tblStyle" type="CT_String" minOccurs="0"/>
      <xsd:element name="tblpPr" type="CT_TblPPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblOverlap" type="CT_TblOverlap" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="bidiVisual" type="CT_OnOff" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblStyleRowBandSize" type="CT_DecimalNumber" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblStyleColBandSize" type="CT_DecimalNumber" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblW" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="jc" type="CT_JcTable" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblCellSpacing" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblInd" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblBorders" type="CT_TblBorders" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="shd" type="CT_Shd" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblLayout" type="CT_TblLayoutType" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblCellMar" type="CT_TblCellMar" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblLook" type="CT_TblLook" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblCaption" type="CT_String" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblDescription" type="CT_String" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TblPr">
    <xsd:complexContent>
      <xsd:extension base="CT_TblPrBase">
        <xsd:sequence>
          <xsd:element name="tblPrChange" type="CT_TblPrChange" minOccurs="0"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_TblPrExBase">
    <xsd:sequence>
      <xsd:element name="tblW" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="jc" type="CT_JcTable" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblCellSpacing" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblInd" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblBorders" type="CT_TblBorders" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="shd" type="CT_Shd" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblLayout" type="CT_TblLayoutType" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblCellMar" type="CT_TblCellMar" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblLook" type="CT_TblLook" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TblPrEx">
    <xsd:complexContent>
      <xsd:extension base="CT_TblPrExBase">
        <xsd:sequence>
          <xsd:element name="tblPrExChange" type="CT_TblPrExChange" minOccurs="0"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_Tbl">
    <xsd:sequence>
      <xsd:group ref="EG_RangeMarkupElements" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="tblPr" type="CT_TblPr"/>
      <xsd:element name="tblGrid" type="CT_TblGrid"/>
      <xsd:group ref="EG_ContentRowContent" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TblLook">
    <xsd:attribute name="firstRow" type="s:ST_OnOff"/>
    <xsd:attribute name="lastRow" type="s:ST_OnOff"/>
    <xsd:attribute name="firstColumn" type="s:ST_OnOff"/>
    <xsd:attribute name="lastColumn" type="s:ST_OnOff"/>
    <xsd:attribute name="noHBand" type="s:ST_OnOff"/>
    <xsd:attribute name="noVBand" type="s:ST_OnOff"/>
    <xsd:attribute name="val" type="ST_ShortHexNumber"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_FtnPos">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="pageBottom"/>
      <xsd:enumeration value="beneathText"/>
      <xsd:enumeration value="sectEnd"/>
      <xsd:enumeration value="docEnd"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_FtnPos">
    <xsd:attribute name="val" type="ST_FtnPos" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_EdnPos">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="sectEnd"/>
      <xsd:enumeration value="docEnd"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_EdnPos">
    <xsd:attribute name="val" type="ST_EdnPos" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_NumFmt">
    <xsd:attribute name="val" type="ST_NumberFormat" use="required"/>
    <xsd:attribute name="format" type="s:ST_String" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_RestartNumber">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="continuous"/>
      <xsd:enumeration value="eachSect"/>
      <xsd:enumeration value="eachPage"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_NumRestart">
    <xsd:attribute name="val" type="ST_RestartNumber" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FtnEdnRef">
    <xsd:attribute name="customMarkFollows" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="id" use="required" type="ST_DecimalNumber"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FtnEdnSepRef">
    <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FtnEdn">
    <xsd:sequence>
      <xsd:group ref="EG_BlockLevelElts" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="type" type="ST_FtnEdn" use="optional"/>
    <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
  </xsd:complexType>
  <xsd:group name="EG_FtnEdnNumProps">
    <xsd:sequence>
      <xsd:element name="numStart" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="numRestart" type="CT_NumRestart" minOccurs="0"/>
    </xsd:sequence>
  </xsd:group>
  <xsd:complexType name="CT_FtnProps">
    <xsd:sequence>
      <xsd:element name="pos" type="CT_FtnPos" minOccurs="0"/>
      <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0"/>
      <xsd:group ref="EG_FtnEdnNumProps" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_EdnProps">
    <xsd:sequence>
      <xsd:element name="pos" type="CT_EdnPos" minOccurs="0"/>
      <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0"/>
      <xsd:group ref="EG_FtnEdnNumProps" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_FtnDocProps">
    <xsd:complexContent>
      <xsd:extension base="CT_FtnProps">
        <xsd:sequence>
          <xsd:element name="footnote" type="CT_FtnEdnSepRef" minOccurs="0" maxOccurs="3"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_EdnDocProps">
    <xsd:complexContent>
      <xsd:extension base="CT_EdnProps">
        <xsd:sequence>
          <xsd:element name="endnote" type="CT_FtnEdnSepRef" minOccurs="0" maxOccurs="3"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_RecipientData">
    <xsd:sequence>
      <xsd:element name="active" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="column" type="CT_DecimalNumber" minOccurs="1"/>
      <xsd:element name="uniqueTag" type="CT_Base64Binary" minOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Base64Binary">
    <xsd:attribute name="val" type="xsd:base64Binary" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Recipients">
    <xsd:sequence>
      <xsd:element name="recipientData" type="CT_RecipientData" minOccurs="1" maxOccurs="unbounded"
      />
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="recipients" type="CT_Recipients"/>
  <xsd:complexType name="CT_OdsoFieldMapData">
    <xsd:sequence>
      <xsd:element name="type" type="CT_MailMergeOdsoFMDFieldType" minOccurs="0"/>
      <xsd:element name="name" type="CT_String" minOccurs="0"/>
      <xsd:element name="mappedName" type="CT_String" minOccurs="0"/>
      <xsd:element name="column" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="lid" type="CT_Lang" minOccurs="0"/>
      <xsd:element name="dynamicAddress" type="CT_OnOff" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_MailMergeSourceType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="database"/>
      <xsd:enumeration value="addressBook"/>
      <xsd:enumeration value="document1"/>
      <xsd:enumeration value="document2"/>
      <xsd:enumeration value="text"/>
      <xsd:enumeration value="email"/>
      <xsd:enumeration value="native"/>
      <xsd:enumeration value="legacy"/>
      <xsd:enumeration value="master"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_MailMergeSourceType">
    <xsd:attribute name="val" use="required" type="ST_MailMergeSourceType"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Odso">
    <xsd:sequence>
      <xsd:element name="udl" type="CT_String" minOccurs="0"/>
      <xsd:element name="table" type="CT_String" minOccurs="0"/>
      <xsd:element name="src" type="CT_Rel" minOccurs="0"/>
      <xsd:element name="colDelim" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="type" type="CT_MailMergeSourceType" minOccurs="0"/>
      <xsd:element name="fHdr" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="fieldMapData" type="CT_OdsoFieldMapData" minOccurs="0"
        maxOccurs="unbounded"/>
      <xsd:element name="recipientData" type="CT_Rel" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_MailMerge">
    <xsd:sequence>
      <xsd:element name="mainDocumentType" type="CT_MailMergeDocType" minOccurs="1"/>
      <xsd:element name="linkToQuery" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="dataType" type="CT_MailMergeDataType" minOccurs="1"/>
      <xsd:element name="connectString" type="CT_String" minOccurs="0"/>
      <xsd:element name="query" type="CT_String" minOccurs="0"/>
      <xsd:element name="dataSource" type="CT_Rel" minOccurs="0"/>
      <xsd:element name="headerSource" type="CT_Rel" minOccurs="0"/>
      <xsd:element name="doNotSuppressBlankLines" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="destination" type="CT_MailMergeDest" minOccurs="0"/>
      <xsd:element name="addressFieldName" type="CT_String" minOccurs="0"/>
      <xsd:element name="mailSubject" type="CT_String" minOccurs="0"/>
      <xsd:element name="mailAsAttachment" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="viewMergedData" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="activeRecord" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="checkErrors" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="odso" type="CT_Odso" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_TargetScreenSz">
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
  <xsd:complexType name="CT_TargetScreenSz">
    <xsd:attribute name="val" type="ST_TargetScreenSz" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Compat">
    <xsd:sequence>
      <xsd:element name="useSingleBorderforContiguousCells" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="wpJustification" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="noTabHangInd" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="noLeading" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="spaceForUL" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="noColumnBalance" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="balanceSingleByteDoubleByteWidth" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="noExtraLineSpacing" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotLeaveBackslashAlone" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="ulTrailSpace" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotExpandShiftReturn" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="spacingInWholePoints" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="lineWrapLikeWord6" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="printBodyTextBeforeHeader" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="printColBlack" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="wpSpaceWidth" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="showBreaksInFrames" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="subFontBySize" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="suppressBottomSpacing" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="suppressTopSpacing" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="suppressSpacingAtTopOfPage" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="suppressTopSpacingWP" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="suppressSpBfAfterPgBrk" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="swapBordersFacingPages" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="convMailMergeEsc" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="truncateFontHeightsLikeWP6" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="mwSmallCaps" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="usePrinterMetrics" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotSuppressParagraphBorders" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="wrapTrailSpaces" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="footnoteLayoutLikeWW8" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="shapeLayoutLikeWW8" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="alignTablesRowByRow" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="forgetLastTabAlignment" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="adjustLineHeightInTable" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="autoSpaceLikeWord95" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="noSpaceRaiseLower" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotUseHTMLParagraphAutoSpacing" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="layoutRawTableWidth" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="layoutTableRowsApart" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="useWord97LineBreakRules" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotBreakWrappedTables" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotSnapToGridInCell" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="selectFldWithFirstOrLastChar" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="applyBreakingRules" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotWrapTextWithPunct" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotUseEastAsianBreakRules" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="useWord2002TableStyleRules" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="growAutofit" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="useFELayout" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="useNormalStyleForList" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotUseIndentAsNumberingTabStop" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="useAltKinsokuLineBreakRules" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="allowSpaceOfSameStyleInTable" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotSuppressIndentation" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotAutofitConstrainedTables" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="autofitToFirstFixedWidthCell" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="underlineTabInNumList" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="displayHangulFixedWidth" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="splitPgBreakAndParaMark" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotVertAlignCellWithSp" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotBreakConstrainedForcedTable" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotVertAlignInTxbx" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="useAnsiKerningPairs" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="cachedColBalance" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="compatSetting" type="CT_CompatSetting" minOccurs="0" maxOccurs="unbounded"
      />
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_CompatSetting">
    <xsd:attribute name="name" type="s:ST_String"/>
    <xsd:attribute name="uri" type="s:ST_String"/>
    <xsd:attribute name="val" type="s:ST_String"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DocVar">
    <xsd:attribute name="name" type="s:ST_String" use="required"/>
    <xsd:attribute name="val" type="s:ST_String" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DocVars">
    <xsd:sequence>
      <xsd:element name="docVar" type="CT_DocVar" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_DocRsids">
    <xsd:sequence>
      <xsd:element name="rsidRoot" type="CT_LongHexNumber" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="rsid" type="CT_LongHexNumber" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_CharacterSpacing">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="doNotCompress"/>
      <xsd:enumeration value="compressPunctuation"/>
      <xsd:enumeration value="compressPunctuationAndJapaneseKana"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_CharacterSpacing">
    <xsd:attribute name="val" type="ST_CharacterSpacing" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_SaveThroughXslt">
    <xsd:attribute ref="r:id" use="optional"/>
    <xsd:attribute name="solutionID" type="s:ST_String" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_RPrDefault">
    <xsd:sequence>
      <xsd:element name="rPr" type="CT_RPr" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_PPrDefault">
    <xsd:sequence>
      <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_DocDefaults">
    <xsd:sequence>
      <xsd:element name="rPrDefault" type="CT_RPrDefault" minOccurs="0"/>
      <xsd:element name="pPrDefault" type="CT_PPrDefault" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_WmlColorSchemeIndex">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="dark1"/>
      <xsd:enumeration value="light1"/>
      <xsd:enumeration value="dark2"/>
      <xsd:enumeration value="light2"/>
      <xsd:enumeration value="accent1"/>
      <xsd:enumeration value="accent2"/>
      <xsd:enumeration value="accent3"/>
      <xsd:enumeration value="accent4"/>
      <xsd:enumeration value="accent5"/>
      <xsd:enumeration value="accent6"/>
      <xsd:enumeration value="hyperlink"/>
      <xsd:enumeration value="followedHyperlink"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_ColorSchemeMapping">
    <xsd:attribute name="bg1" type="ST_WmlColorSchemeIndex"/>
    <xsd:attribute name="t1" type="ST_WmlColorSchemeIndex"/>
    <xsd:attribute name="bg2" type="ST_WmlColorSchemeIndex"/>
    <xsd:attribute name="t2" type="ST_WmlColorSchemeIndex"/>
    <xsd:attribute name="accent1" type="ST_WmlColorSchemeIndex"/>
    <xsd:attribute name="accent2" type="ST_WmlColorSchemeIndex"/>
    <xsd:attribute name="accent3" type="ST_WmlColorSchemeIndex"/>
    <xsd:attribute name="accent4" type="ST_WmlColorSchemeIndex"/>
    <xsd:attribute name="accent5" type="ST_WmlColorSchemeIndex"/>
    <xsd:attribute name="accent6" type="ST_WmlColorSchemeIndex"/>
    <xsd:attribute name="hyperlink" type="ST_WmlColorSchemeIndex"/>
    <xsd:attribute name="followedHyperlink" type="ST_WmlColorSchemeIndex"/>
  </xsd:complexType>
  <xsd:complexType name="CT_ReadingModeInkLockDown">
    <xsd:attribute name="actualPg" type="s:ST_OnOff" use="required"/>
    <xsd:attribute name="w" type="ST_PixelsMeasure" use="required"/>
    <xsd:attribute name="h" type="ST_PixelsMeasure" use="required"/>
    <xsd:attribute name="fontSz" type="ST_DecimalNumberOrPercent" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_WriteProtection">
    <xsd:attribute name="recommended" type="s:ST_OnOff" use="optional"/>
    <xsd:attributeGroup ref="AG_Password"/>
    <xsd:attributeGroup ref="AG_TransitionalPassword"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Settings">
    <xsd:sequence>
      <xsd:element name="writeProtection" type="CT_WriteProtection" minOccurs="0"/>
      <xsd:element name="view" type="CT_View" minOccurs="0"/>
      <xsd:element name="zoom" type="CT_Zoom" minOccurs="0"/>
      <xsd:element name="removePersonalInformation" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="removeDateAndTime" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotDisplayPageBoundaries" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="displayBackgroundShape" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="printPostScriptOverText" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="printFractionalCharacterWidth" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="printFormsData" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="embedTrueTypeFonts" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="embedSystemFonts" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="saveSubsetFonts" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="saveFormsData" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="mirrorMargins" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="alignBordersAndEdges" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="bordersDoNotSurroundHeader" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="bordersDoNotSurroundFooter" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="gutterAtTop" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="hideSpellingErrors" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="hideGrammaticalErrors" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="activeWritingStyle" type="CT_WritingStyle" minOccurs="0"
        maxOccurs="unbounded"/>
      <xsd:element name="proofState" type="CT_Proof" minOccurs="0"/>
      <xsd:element name="formsDesign" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="attachedTemplate" type="CT_Rel" minOccurs="0"/>
      <xsd:element name="linkStyles" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="stylePaneFormatFilter" type="CT_StylePaneFilter" minOccurs="0"/>
      <xsd:element name="stylePaneSortMethod" type="CT_StyleSort" minOccurs="0"/>
      <xsd:element name="documentType" type="CT_DocType" minOccurs="0"/>
      <xsd:element name="mailMerge" type="CT_MailMerge" minOccurs="0"/>
      <xsd:element name="revisionView" type="CT_TrackChangesView" minOccurs="0"/>
      <xsd:element name="trackRevisions" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotTrackMoves" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotTrackFormatting" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="documentProtection" type="CT_DocProtect" minOccurs="0"/>
      <xsd:element name="autoFormatOverride" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="styleLockTheme" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="styleLockQFSet" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="defaultTabStop" type="CT_TwipsMeasure" minOccurs="0"/>
      <xsd:element name="autoHyphenation" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="consecutiveHyphenLimit" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="hyphenationZone" type="CT_TwipsMeasure" minOccurs="0"/>
      <xsd:element name="doNotHyphenateCaps" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="showEnvelope" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="summaryLength" type="CT_DecimalNumberOrPrecent" minOccurs="0"/>
      <xsd:element name="clickAndTypeStyle" type="CT_String" minOccurs="0"/>
      <xsd:element name="defaultTableStyle" type="CT_String" minOccurs="0"/>
      <xsd:element name="evenAndOddHeaders" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="bookFoldRevPrinting" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="bookFoldPrinting" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="bookFoldPrintingSheets" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="drawingGridHorizontalSpacing" type="CT_TwipsMeasure" minOccurs="0"/>
      <xsd:element name="drawingGridVerticalSpacing" type="CT_TwipsMeasure" minOccurs="0"/>
      <xsd:element name="displayHorizontalDrawingGridEvery" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="displayVerticalDrawingGridEvery" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="doNotUseMarginsForDrawingGridOrigin" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="drawingGridHorizontalOrigin" type="CT_TwipsMeasure" minOccurs="0"/>
      <xsd:element name="drawingGridVerticalOrigin" type="CT_TwipsMeasure" minOccurs="0"/>
      <xsd:element name="doNotShadeFormData" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="noPunctuationKerning" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="characterSpacingControl" type="CT_CharacterSpacing" minOccurs="0"/>
      <xsd:element name="printTwoOnOne" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="strictFirstAndLastChars" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="noLineBreaksAfter" type="CT_Kinsoku" minOccurs="0"/>
      <xsd:element name="noLineBreaksBefore" type="CT_Kinsoku" minOccurs="0"/>
      <xsd:element name="savePreviewPicture" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotValidateAgainstSchema" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="saveInvalidXml" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="ignoreMixedContent" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="alwaysShowPlaceholderText" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotDemarcateInvalidXml" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="saveXmlDataOnly" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="useXSLTWhenSaving" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="saveThroughXslt" type="CT_SaveThroughXslt" minOccurs="0"/>
      <xsd:element name="showXMLTags" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="alwaysMergeEmptyNamespace" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="updateFields" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="hdrShapeDefaults" type="CT_ShapeDefaults" minOccurs="0"/>
      <xsd:element name="footnotePr" type="CT_FtnDocProps" minOccurs="0"/>
      <xsd:element name="endnotePr" type="CT_EdnDocProps" minOccurs="0"/>
      <xsd:element name="compat" type="CT_Compat" minOccurs="0"/>
      <xsd:element name="docVars" type="CT_DocVars" minOccurs="0"/>
      <xsd:element name="rsids" type="CT_DocRsids" minOccurs="0"/>
      <xsd:element ref="m:mathPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="attachedSchema" type="CT_String" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="themeFontLang" type="CT_Language" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="clrSchemeMapping" type="CT_ColorSchemeMapping" minOccurs="0"/>
      <xsd:element name="doNotIncludeSubdocsInStats" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotAutoCompressPictures" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="forceUpgrade" type="CT_Empty" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="captions" type="CT_Captions" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="readModeInkLockDown" type="CT_ReadingModeInkLockDown" minOccurs="0"/>
      <xsd:element name="smartTagType" type="CT_SmartTagType" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element ref="sl:schemaLibrary" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="shapeDefaults" type="CT_ShapeDefaults" minOccurs="0"/>
      <xsd:element name="doNotEmbedSmartTags" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="decimalSymbol" type="CT_String" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="listSeparator" type="CT_String" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_StyleSort">
    <xsd:attribute name="val" type="ST_StyleSort" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_StylePaneFilter">
    <xsd:attribute name="allStyles" type="s:ST_OnOff"/>
    <xsd:attribute name="customStyles" type="s:ST_OnOff"/>
    <xsd:attribute name="latentStyles" type="s:ST_OnOff"/>
    <xsd:attribute name="stylesInUse" type="s:ST_OnOff"/>
    <xsd:attribute name="headingStyles" type="s:ST_OnOff"/>
    <xsd:attribute name="numberingStyles" type="s:ST_OnOff"/>
    <xsd:attribute name="tableStyles" type="s:ST_OnOff"/>
    <xsd:attribute name="directFormattingOnRuns" type="s:ST_OnOff"/>
    <xsd:attribute name="directFormattingOnParagraphs" type="s:ST_OnOff"/>
    <xsd:attribute name="directFormattingOnNumbering" type="s:ST_OnOff"/>
    <xsd:attribute name="directFormattingOnTables" type="s:ST_OnOff"/>
    <xsd:attribute name="clearFormatting" type="s:ST_OnOff"/>
    <xsd:attribute name="top3HeadingStyles" type="s:ST_OnOff"/>
    <xsd:attribute name="visibleStyles" type="s:ST_OnOff"/>
    <xsd:attribute name="alternateStyleNames" type="s:ST_OnOff"/>
    <xsd:attribute name="val" type="ST_ShortHexNumber"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_StyleSort">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="name"/>
      <xsd:enumeration value="priority"/>
      <xsd:enumeration value="default"/>
      <xsd:enumeration value="font"/>
      <xsd:enumeration value="basedOn"/>
      <xsd:enumeration value="type"/>
      <xsd:enumeration value="0000"/>
      <xsd:enumeration value="0001"/>
      <xsd:enumeration value="0002"/>
      <xsd:enumeration value="0003"/>
      <xsd:enumeration value="0004"/>
      <xsd:enumeration value="0005"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_WebSettings">
    <xsd:sequence>
      <xsd:element name="frameset" type="CT_Frameset" minOccurs="0"/>
      <xsd:element name="divs" type="CT_Divs" minOccurs="0"/>
      <xsd:element name="encoding" type="CT_String" minOccurs="0"/>
      <xsd:element name="optimizeForBrowser" type="CT_OptimizeForBrowser" minOccurs="0"/>
      <xsd:element name="relyOnVML" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="allowPNG" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotRelyOnCSS" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotSaveAsSingleFile" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotOrganizeInFolder" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="doNotUseLongFileNames" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="pixelsPerInch" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="targetScreenSz" type="CT_TargetScreenSz" minOccurs="0"/>
      <xsd:element name="saveSmartTagsAsXml" type="CT_OnOff" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_FrameScrollbar">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="on"/>
      <xsd:enumeration value="off"/>
      <xsd:enumeration value="auto"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_FrameScrollbar">
    <xsd:attribute name="val" type="ST_FrameScrollbar" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_OptimizeForBrowser">
    <xsd:complexContent>
      <xsd:extension base="CT_OnOff">
        <xsd:attribute name="target" type="s:ST_String" use="optional"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_Frame">
    <xsd:sequence>
      <xsd:element name="sz" type="CT_String" minOccurs="0"/>
      <xsd:element name="name" type="CT_String" minOccurs="0"/>
      <xsd:element name="title" type="CT_String" minOccurs="0"/>
      <xsd:element name="longDesc" type="CT_Rel" minOccurs="0"/>
      <xsd:element name="sourceFileName" type="CT_Rel" minOccurs="0"/>
      <xsd:element name="marW" type="CT_PixelsMeasure" minOccurs="0"/>
      <xsd:element name="marH" type="CT_PixelsMeasure" minOccurs="0"/>
      <xsd:element name="scrollbar" type="CT_FrameScrollbar" minOccurs="0"/>
      <xsd:element name="noResizeAllowed" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="linkedToFile" type="CT_OnOff" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_FrameLayout">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="rows"/>
      <xsd:enumeration value="cols"/>
      <xsd:enumeration value="none"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_FrameLayout">
    <xsd:attribute name="val" type="ST_FrameLayout" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FramesetSplitbar">
    <xsd:sequence>
      <xsd:element name="w" type="CT_TwipsMeasure" minOccurs="0"/>
      <xsd:element name="color" type="CT_Color" minOccurs="0"/>
      <xsd:element name="noBorder" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="flatBorders" type="CT_OnOff" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Frameset">
    <xsd:sequence>
      <xsd:element name="sz" type="CT_String" minOccurs="0"/>
      <xsd:element name="framesetSplitbar" type="CT_FramesetSplitbar" minOccurs="0"/>
      <xsd:element name="frameLayout" type="CT_FrameLayout" minOccurs="0"/>
      <xsd:element name="title" type="CT_String" minOccurs="0"/>
      <xsd:choice minOccurs="0" maxOccurs="unbounded">
        <xsd:element name="frameset" type="CT_Frameset" minOccurs="0" maxOccurs="unbounded"/>
        <xsd:element name="frame" type="CT_Frame" minOccurs="0" maxOccurs="unbounded"/>
      </xsd:choice>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_NumPicBullet">
    <xsd:choice>
      <xsd:element name="pict" type="CT_Picture"/>
      <xsd:element name="drawing" type="CT_Drawing"/>
    </xsd:choice>
    <xsd:attribute name="numPicBulletId" type="ST_DecimalNumber" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_LevelSuffix">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="tab"/>
      <xsd:enumeration value="space"/>
      <xsd:enumeration value="nothing"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_LevelSuffix">
    <xsd:attribute name="val" type="ST_LevelSuffix" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_LevelText">
    <xsd:attribute name="val" type="s:ST_String" use="optional"/>
    <xsd:attribute name="null" type="s:ST_OnOff" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_LvlLegacy">
    <xsd:attribute name="legacy" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="legacySpace" type="s:ST_TwipsMeasure" use="optional"/>
    <xsd:attribute name="legacyIndent" type="ST_SignedTwipsMeasure" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Lvl">
    <xsd:sequence>
      <xsd:element name="start" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0"/>
      <xsd:element name="lvlRestart" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="pStyle" type="CT_String" minOccurs="0"/>
      <xsd:element name="isLgl" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="suff" type="CT_LevelSuffix" minOccurs="0"/>
      <xsd:element name="lvlText" type="CT_LevelText" minOccurs="0"/>
      <xsd:element name="lvlPicBulletId" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="legacy" type="CT_LvlLegacy" minOccurs="0"/>
      <xsd:element name="lvlJc" type="CT_Jc" minOccurs="0"/>
      <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0"/>
      <xsd:element name="rPr" type="CT_RPr" minOccurs="0"/>
    </xsd:sequence>
    <xsd:attribute name="ilvl" type="ST_DecimalNumber" use="required"/>
    <xsd:attribute name="tplc" type="ST_LongHexNumber" use="optional"/>
    <xsd:attribute name="tentative" type="s:ST_OnOff" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_MultiLevelType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="singleLevel"/>
      <xsd:enumeration value="multilevel"/>
      <xsd:enumeration value="hybridMultilevel"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_MultiLevelType">
    <xsd:attribute name="val" type="ST_MultiLevelType" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AbstractNum">
    <xsd:sequence>
      <xsd:element name="nsid" type="CT_LongHexNumber" minOccurs="0"/>
      <xsd:element name="multiLevelType" type="CT_MultiLevelType" minOccurs="0"/>
      <xsd:element name="tmpl" type="CT_LongHexNumber" minOccurs="0"/>
      <xsd:element name="name" type="CT_String" minOccurs="0"/>
      <xsd:element name="styleLink" type="CT_String" minOccurs="0"/>
      <xsd:element name="numStyleLink" type="CT_String" minOccurs="0"/>
      <xsd:element name="lvl" type="CT_Lvl" minOccurs="0" maxOccurs="9"/>
    </xsd:sequence>
    <xsd:attribute name="abstractNumId" type="ST_DecimalNumber" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_NumLvl">
    <xsd:sequence>
      <xsd:element name="startOverride" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="lvl" type="CT_Lvl" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="ilvl" type="ST_DecimalNumber" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Num">
    <xsd:sequence>
      <xsd:element name="abstractNumId" type="CT_DecimalNumber" minOccurs="1"/>
      <xsd:element name="lvlOverride" type="CT_NumLvl" minOccurs="0" maxOccurs="9"/>
    </xsd:sequence>
    <xsd:attribute name="numId" type="ST_DecimalNumber" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Numbering">
    <xsd:sequence>
      <xsd:element name="numPicBullet" type="CT_NumPicBullet" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="abstractNum" type="CT_AbstractNum" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="num" type="CT_Num" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="numIdMacAtCleanup" type="CT_DecimalNumber" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="ST_TblStyleOverrideType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="wholeTable"/>
      <xsd:enumeration value="firstRow"/>
      <xsd:enumeration value="lastRow"/>
      <xsd:enumeration value="firstCol"/>
      <xsd:enumeration value="lastCol"/>
      <xsd:enumeration value="band1Vert"/>
      <xsd:enumeration value="band2Vert"/>
      <xsd:enumeration value="band1Horz"/>
      <xsd:enumeration value="band2Horz"/>
      <xsd:enumeration value="neCell"/>
      <xsd:enumeration value="nwCell"/>
      <xsd:enumeration value="seCell"/>
      <xsd:enumeration value="swCell"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_TblStylePr">
    <xsd:sequence>
      <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0"/>
      <xsd:element name="rPr" type="CT_RPr" minOccurs="0"/>
      <xsd:element name="tblPr" type="CT_TblPrBase" minOccurs="0"/>
      <xsd:element name="trPr" type="CT_TrPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tcPr" type="CT_TcPr" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="type" type="ST_TblStyleOverrideType" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_StyleType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="paragraph"/>
      <xsd:enumeration value="character"/>
      <xsd:enumeration value="table"/>
      <xsd:enumeration value="numbering"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Style">
    <xsd:sequence>
      <xsd:element name="name" type="CT_String" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="aliases" type="CT_String" minOccurs="0"/>
      <xsd:element name="basedOn" type="CT_String" minOccurs="0"/>
      <xsd:element name="next" type="CT_String" minOccurs="0"/>
      <xsd:element name="link" type="CT_String" minOccurs="0"/>
      <xsd:element name="autoRedefine" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="hidden" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="uiPriority" type="CT_DecimalNumber" minOccurs="0"/>
      <xsd:element name="semiHidden" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="unhideWhenUsed" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="qFormat" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="locked" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="personal" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="personalCompose" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="personalReply" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="rsid" type="CT_LongHexNumber" minOccurs="0"/>
      <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="rPr" type="CT_RPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblPr" type="CT_TblPrBase" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="trPr" type="CT_TrPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tcPr" type="CT_TcPr" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="tblStylePr" type="CT_TblStylePr" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="type" type="ST_StyleType" use="optional"/>
    <xsd:attribute name="styleId" type="s:ST_String" use="optional"/>
    <xsd:attribute name="default" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="customStyle" type="s:ST_OnOff" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_LsdException">
    <xsd:attribute name="name" type="s:ST_String" use="required"/>
    <xsd:attribute name="locked" type="s:ST_OnOff"/>
    <xsd:attribute name="uiPriority" type="ST_DecimalNumber"/>
    <xsd:attribute name="semiHidden" type="s:ST_OnOff"/>
    <xsd:attribute name="unhideWhenUsed" type="s:ST_OnOff"/>
    <xsd:attribute name="qFormat" type="s:ST_OnOff"/>
  </xsd:complexType>
  <xsd:complexType name="CT_LatentStyles">
    <xsd:sequence>
      <xsd:element name="lsdException" type="CT_LsdException" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="defLockedState" type="s:ST_OnOff"/>
    <xsd:attribute name="defUIPriority" type="ST_DecimalNumber"/>
    <xsd:attribute name="defSemiHidden" type="s:ST_OnOff"/>
    <xsd:attribute name="defUnhideWhenUsed" type="s:ST_OnOff"/>
    <xsd:attribute name="defQFormat" type="s:ST_OnOff"/>
    <xsd:attribute name="count" type="ST_DecimalNumber"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Styles">
    <xsd:sequence>
      <xsd:element name="docDefaults" type="CT_DocDefaults" minOccurs="0"/>
      <xsd:element name="latentStyles" type="CT_LatentStyles" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="style" type="CT_Style" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Panose">
    <xsd:attribute name="val" type="s:ST_Panose" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_FontFamily">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="decorative"/>
      <xsd:enumeration value="modern"/>
      <xsd:enumeration value="roman"/>
      <xsd:enumeration value="script"/>
      <xsd:enumeration value="swiss"/>
      <xsd:enumeration value="auto"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_FontFamily">
    <xsd:attribute name="val" type="ST_FontFamily" use="required"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_Pitch">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="fixed"/>
      <xsd:enumeration value="variable"/>
      <xsd:enumeration value="default"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Pitch">
    <xsd:attribute name="val" type="ST_Pitch" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FontSig">
    <xsd:attribute name="usb0" use="required" type="ST_LongHexNumber"/>
    <xsd:attribute name="usb1" use="required" type="ST_LongHexNumber"/>
    <xsd:attribute name="usb2" use="required" type="ST_LongHexNumber"/>
    <xsd:attribute name="usb3" use="required" type="ST_LongHexNumber"/>
    <xsd:attribute name="csb0" use="required" type="ST_LongHexNumber"/>
    <xsd:attribute name="csb1" use="required" type="ST_LongHexNumber"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FontRel">
    <xsd:complexContent>
      <xsd:extension base="CT_Rel">
        <xsd:attribute name="fontKey" type="s:ST_Guid"/>
        <xsd:attribute name="subsetted" type="s:ST_OnOff"/>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_Font">
    <xsd:sequence>
      <xsd:element name="altName" type="CT_String" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="panose1" type="CT_Panose" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="charset" type="CT_Charset" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="family" type="CT_FontFamily" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="notTrueType" type="CT_OnOff" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="pitch" type="CT_Pitch" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="sig" type="CT_FontSig" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="embedRegular" type="CT_FontRel" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="embedBold" type="CT_FontRel" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="embedItalic" type="CT_FontRel" minOccurs="0" maxOccurs="1"/>
      <xsd:element name="embedBoldItalic" type="CT_FontRel" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
    <xsd:attribute name="name" type="s:ST_String" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_FontsList">
    <xsd:sequence>
      <xsd:element name="font" type="CT_Font" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_DivBdr">
    <xsd:sequence>
      <xsd:element name="top" type="CT_Border" minOccurs="0"/>
      <xsd:element name="left" type="CT_Border" minOccurs="0"/>
      <xsd:element name="bottom" type="CT_Border" minOccurs="0"/>
      <xsd:element name="right" type="CT_Border" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Div">
    <xsd:sequence>
      <xsd:element name="blockQuote" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="bodyDiv" type="CT_OnOff" minOccurs="0"/>
      <xsd:element name="marLeft" type="CT_SignedTwipsMeasure"/>
      <xsd:element name="marRight" type="CT_SignedTwipsMeasure"/>
      <xsd:element name="marTop" type="CT_SignedTwipsMeasure"/>
      <xsd:element name="marBottom" type="CT_SignedTwipsMeasure"/>
      <xsd:element name="divBdr" type="CT_DivBdr" minOccurs="0"/>
      <xsd:element name="divsChild" type="CT_Divs" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
    <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_Divs">
    <xsd:sequence minOccurs="1" maxOccurs="unbounded">
      <xsd:element name="div" type="CT_Div"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_TxbxContent">
    <xsd:group ref="EG_BlockLevelElts" minOccurs="1" maxOccurs="unbounded"/>
  </xsd:complexType>
  <xsd:element name="txbxContent" type="CT_TxbxContent"/>
  <xsd:group name="EG_MathContent">
    <xsd:choice>
      <xsd:element ref="m:oMathPara"/>
      <xsd:element ref="m:oMath"/>
    </xsd:choice>
  </xsd:group>
  <xsd:group name="EG_BlockLevelChunkElts">
    <xsd:choice>
      <xsd:group ref="EG_ContentBlockContent" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:group>
  <xsd:group name="EG_BlockLevelElts">
    <xsd:choice>
      <xsd:group ref="EG_BlockLevelChunkElts" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="altChunk" type="CT_AltChunk" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:group>
  <xsd:group name="EG_RunLevelElts">
    <xsd:choice>
      <xsd:element name="proofErr" minOccurs="0" type="CT_ProofErr"/>
      <xsd:element name="permStart" minOccurs="0" type="CT_PermStart"/>
      <xsd:element name="permEnd" minOccurs="0" type="CT_Perm"/>
      <xsd:group ref="EG_RangeMarkupElements" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="ins" type="CT_RunTrackChange" minOccurs="0"/>
      <xsd:element name="del" type="CT_RunTrackChange" minOccurs="0"/>
      <xsd:element name="moveFrom" type="CT_RunTrackChange"/>
      <xsd:element name="moveTo" type="CT_RunTrackChange"/>
      <xsd:group ref="EG_MathContent" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:group>
  <xsd:complexType name="CT_Body">
    <xsd:sequence>
      <xsd:group ref="EG_BlockLevelElts" minOccurs="0" maxOccurs="unbounded"/>
      <xsd:element name="sectPr" minOccurs="0" maxOccurs="1" type="CT_SectPr"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_ShapeDefaults">
    <xsd:choice maxOccurs="unbounded">
      <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:office:office"
        minOccurs="0" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:complexType name="CT_Comments">
    <xsd:sequence>
      <xsd:element name="comment" type="CT_Comment" minOccurs="0" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="comments" type="CT_Comments"/>
  <xsd:complexType name="CT_Footnotes">
    <xsd:sequence maxOccurs="unbounded">
      <xsd:element name="footnote" type="CT_FtnEdn" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="footnotes" type="CT_Footnotes"/>
  <xsd:complexType name="CT_Endnotes">
    <xsd:sequence maxOccurs="unbounded">
      <xsd:element name="endnote" type="CT_FtnEdn" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:element name="endnotes" type="CT_Endnotes"/>
  <xsd:element name="hdr" type="CT_HdrFtr"/>
  <xsd:element name="ftr" type="CT_HdrFtr"/>
  <xsd:complexType name="CT_SmartTagType">
    <xsd:attribute name="namespaceuri" type="s:ST_String"/>
    <xsd:attribute name="name" type="s:ST_String"/>
    <xsd:attribute name="url" type="s:ST_String"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_ThemeColor">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="dark1"/>
      <xsd:enumeration value="light1"/>
      <xsd:enumeration value="dark2"/>
      <xsd:enumeration value="light2"/>
      <xsd:enumeration value="accent1"/>
      <xsd:enumeration value="accent2"/>
      <xsd:enumeration value="accent3"/>
      <xsd:enumeration value="accent4"/>
      <xsd:enumeration value="accent5"/>
      <xsd:enumeration value="accent6"/>
      <xsd:enumeration value="hyperlink"/>
      <xsd:enumeration value="followedHyperlink"/>
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="background1"/>
      <xsd:enumeration value="text1"/>
      <xsd:enumeration value="background2"/>
      <xsd:enumeration value="text2"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="ST_DocPartBehavior">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="content"/>
      <xsd:enumeration value="p"/>
      <xsd:enumeration value="pg"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_DocPartBehavior">
    <xsd:attribute name="val" use="required" type="ST_DocPartBehavior"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DocPartBehaviors">
    <xsd:choice>
      <xsd:element name="behavior" type="CT_DocPartBehavior" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:simpleType name="ST_DocPartType">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="none"/>
      <xsd:enumeration value="normal"/>
      <xsd:enumeration value="autoExp"/>
      <xsd:enumeration value="toolbar"/>
      <xsd:enumeration value="speller"/>
      <xsd:enumeration value="formFld"/>
      <xsd:enumeration value="bbPlcHdr"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_DocPartType">
    <xsd:attribute name="val" use="required" type="ST_DocPartType"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DocPartTypes">
    <xsd:choice>
      <xsd:element name="type" type="CT_DocPartType" maxOccurs="unbounded"/>
    </xsd:choice>
    <xsd:attribute name="all" type="s:ST_OnOff" use="optional"/>
  </xsd:complexType>
  <xsd:simpleType name="ST_DocPartGallery">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="placeholder"/>
      <xsd:enumeration value="any"/>
      <xsd:enumeration value="default"/>
      <xsd:enumeration value="docParts"/>
      <xsd:enumeration value="coverPg"/>
      <xsd:enumeration value="eq"/>
      <xsd:enumeration value="ftrs"/>
      <xsd:enumeration value="hdrs"/>
      <xsd:enumeration value="pgNum"/>
      <xsd:enumeration value="tbls"/>
      <xsd:enumeration value="watermarks"/>
      <xsd:enumeration value="autoTxt"/>
      <xsd:enumeration value="txtBox"/>
      <xsd:enumeration value="pgNumT"/>
      <xsd:enumeration value="pgNumB"/>
      <xsd:enumeration value="pgNumMargins"/>
      <xsd:enumeration value="tblOfContents"/>
      <xsd:enumeration value="bib"/>
      <xsd:enumeration value="custQuickParts"/>
      <xsd:enumeration value="custCoverPg"/>
      <xsd:enumeration value="custEq"/>
      <xsd:enumeration value="custFtrs"/>
      <xsd:enumeration value="custHdrs"/>
      <xsd:enumeration value="custPgNum"/>
      <xsd:enumeration value="custTbls"/>
      <xsd:enumeration value="custWatermarks"/>
      <xsd:enumeration value="custAutoTxt"/>
      <xsd:enumeration value="custTxtBox"/>
      <xsd:enumeration value="custPgNumT"/>
      <xsd:enumeration value="custPgNumB"/>
      <xsd:enumeration value="custPgNumMargins"/>
      <xsd:enumeration value="custTblOfContents"/>
      <xsd:enumeration value="custBib"/>
      <xsd:enumeration value="custom1"/>
      <xsd:enumeration value="custom2"/>
      <xsd:enumeration value="custom3"/>
      <xsd:enumeration value="custom4"/>
      <xsd:enumeration value="custom5"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_DocPartGallery">
    <xsd:attribute name="val" type="ST_DocPartGallery" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DocPartCategory">
    <xsd:sequence>
      <xsd:element name="name" type="CT_String" minOccurs="1" maxOccurs="1"/>
      <xsd:element name="gallery" type="CT_DocPartGallery" minOccurs="1" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_DocPartName">
    <xsd:attribute name="val" type="s:ST_String" use="required"/>
    <xsd:attribute name="decorated" type="s:ST_OnOff" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_DocPartPr">
    <xsd:all>
      <xsd:element name="name" type="CT_DocPartName" minOccurs="1"/>
      <xsd:element name="style" type="CT_String" minOccurs="0"/>
      <xsd:element name="category" type="CT_DocPartCategory" minOccurs="0"/>
      <xsd:element name="types" type="CT_DocPartTypes" minOccurs="0"/>
      <xsd:element name="behaviors" type="CT_DocPartBehaviors" minOccurs="0"/>
      <xsd:element name="description" type="CT_String" minOccurs="0"/>
      <xsd:element name="guid" type="CT_Guid" minOccurs="0"/>
    </xsd:all>
  </xsd:complexType>
  <xsd:complexType name="CT_DocPart">
    <xsd:sequence>
      <xsd:element name="docPartPr" type="CT_DocPartPr" minOccurs="0"/>
      <xsd:element name="docPartBody" type="CT_Body" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_DocParts">
    <xsd:choice>
      <xsd:element name="docPart" type="CT_DocPart" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:choice>
  </xsd:complexType>
  <xsd:element name="settings" type="CT_Settings"/>
  <xsd:element name="webSettings" type="CT_WebSettings"/>
  <xsd:element name="fonts" type="CT_FontsList"/>
  <xsd:element name="numbering" type="CT_Numbering"/>
  <xsd:element name="styles" type="CT_Styles"/>
  <xsd:simpleType name="ST_CaptionPos">
    <xsd:restriction base="xsd:string">
      <xsd:enumeration value="above"/>
      <xsd:enumeration value="below"/>
      <xsd:enumeration value="left"/>
      <xsd:enumeration value="right"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:complexType name="CT_Caption">
    <xsd:attribute name="name" type="s:ST_String" use="required"/>
    <xsd:attribute name="pos" type="ST_CaptionPos" use="optional"/>
    <xsd:attribute name="chapNum" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="heading" type="ST_DecimalNumber" use="optional"/>
    <xsd:attribute name="noLabel" type="s:ST_OnOff" use="optional"/>
    <xsd:attribute name="numFmt" type="ST_NumberFormat" use="optional"/>
    <xsd:attribute name="sep" type="ST_ChapterSep" use="optional"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AutoCaption">
    <xsd:attribute name="name" type="s:ST_String" use="required"/>
    <xsd:attribute name="caption" type="s:ST_String" use="required"/>
  </xsd:complexType>
  <xsd:complexType name="CT_AutoCaptions">
    <xsd:sequence>
      <xsd:element name="autoCaption" type="CT_AutoCaption" minOccurs="1" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Captions">
    <xsd:sequence>
      <xsd:element name="caption" type="CT_Caption" minOccurs="1" maxOccurs="unbounded"/>
      <xsd:element name="autoCaptions" type="CT_AutoCaptions" minOccurs="0" maxOccurs="1"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_DocumentBase">
    <xsd:sequence>
      <xsd:element name="background" type="CT_Background" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="CT_Document">
    <xsd:complexContent>
      <xsd:extension base="CT_DocumentBase">
        <xsd:sequence>
          <xsd:element name="body" type="CT_Body" minOccurs="0" maxOccurs="1"/>
        </xsd:sequence>
        <xsd:attribute name="conformance" type="s:ST_ConformanceClass"/>
        <xsd:attribute ref="mc:Ignorable" use="optional" />
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="CT_GlossaryDocument">
    <xsd:complexContent>
      <xsd:extension base="CT_DocumentBase">
        <xsd:sequence>
          <xsd:element name="docParts" type="CT_DocParts" minOccurs="0"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="document" type="CT_Document"/>
  <xsd:element name="glossaryDocument" type="CT_GlossaryDocument"/>
</xsd:schema>
