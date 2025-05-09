<?xml version="1.0"?>
<xsl:transform version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:strip-space elements="*"/>
    <xsl:output method="xml" indent="yes"/>
    <xsl:param name="chart" select="2016"/>
    <xsl:param name="lang"/>
    <xsl:template match="data">
        <xsl:copy>
            <xsl:apply-templates select="@*"/>
            <xsl:attribute name="language"><xsl:value-of select="$lang"/></xsl:attribute>
            <xsl:apply-templates select="node()"/>
        </xsl:copy>
    </xsl:template>
    <xsl:template match="record[@id]">
        <xsl:choose>
            <xsl:when test="@chart=$chart or not(@chart)">
                <xsl:copy>
                    <xsl:attribute name="id">
                        <xsl:value-of select="attribute::id"/>_<xsl:value-of select="$chart"/>_<xsl:value-of select="$lang"/>
                    </xsl:attribute>
                    <xsl:apply-templates select="@*|node()"/>
                </xsl:copy>
            </xsl:when>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="@*">
        <xsl:choose>
            <xsl:when test="name()='id' or name()='lang' or name()='chart'"></xsl:when>
            <xsl:when test="name()='ref'">
                <xsl:attribute name="ref">
                    <xsl:value-of select="."/>_<xsl:value-of select="$chart"/>_<xsl:value-of select="$lang"/>
                </xsl:attribute>
            </xsl:when>
            <xsl:otherwise>
                <xsl:copy/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="node()">
        <xsl:choose>
            <xsl:when test="(@lang=$lang or not(@lang)) and (@chart=$chart or not(@chart))">
                <xsl:copy>
                    <xsl:apply-templates select="@*|node()"/>
                </xsl:copy>
            </xsl:when>
        </xsl:choose>
    </xsl:template>
</xsl:transform>
