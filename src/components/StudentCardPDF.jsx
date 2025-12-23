import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Defs, LinearGradient, Stop } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  card: {
    width: 204, // Match preview dimensions
    height: 340, // Match preview dimensions
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  frontSide: {
    // Front side specific styles
  },
  backSide: {
    // Back side specific styles
  },
  leftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#2563EB',
  },
  rightBorder: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#2563EB',
  },
  header: {
    position: 'relative',
    backgroundColor: '#2563EB',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 1,
    paddingTop: 3,
  },
  logoContainer: {
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#93C5FD',
    marginBottom: 1,
  },
  logo: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  titleContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 1,
    paddingVertical: 0.5,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 1,
  },
  title: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#1E40AF',
    textAlign: 'center',
  },
  content: {
    padding: 3,
    flex: 1,
  },
  photoContainer: {
    width: 16,
    height: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 2,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0.5,
    marginRight: 1,
  },
  photo: {
    width: 14,
    height: 18,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 1,
    lineHeight: 1.2,
  },
  infoText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 1,
    lineHeight: 1.2,
  },
  infoTextBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
    lineHeight: 1.2,
  },
  qrContainer: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    alignSelf: 'center',
  },
  qrCode: {
    width: 18,
    height: 18,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#2563EB',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  backContent: {
    padding: 3,
    flex: 1,
    justifyContent: 'space-between',
  },
  detailsSection: {
    backgroundColor: '#F9FAFB',
    padding: 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0.5,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    width: 40,
  },
  detailValue: {
    fontSize: 9,
    color: '#374151',
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    borderStyle: 'dashed',
    minHeight: 12,
    paddingHorizontal: 1,
  },
  infoSection: {
    backgroundColor: '#EFF6FF',
    padding: 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 2,
  },
  infoList: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
  },
  signatureSection: {
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    paddingTop: 2,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 1,
  },
  signatureLine: {
    width: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    borderStyle: 'dashed',
    height: 16,
  },
});

// StudentCardPDF Component
const StudentCardPDF = ({ student, qrCodeUrl }) => {
  const studentName = `${student.firstName} ${student.lastName}`;
  const studentId = student.studentProfile?.registrationNumber || student.admissionNumber || 'Not Assigned';
  const studentClass = student.studentProfile?.classId?.name || student.classId?.name || 'Not Assigned';
  const fatherName = student.parentInfo?.fatherName || '';
  const dob = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const bloodGroup = student.bloodGroup || '';

  return (
    <Document>
      <Page size="A6" orientation="landscape" style={styles.page}>
        {/* Front Side */}
        <View style={[styles.card, styles.frontSide]}>
          {/* Left Border Gradient */}
          <View style={styles.leftBorder} />

          {/* Header */}
          <View style={styles.header}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                style={styles.logo}
                src="/easeacademy_logo.jpg"
                // Fallback if image fails
                onError={() => {
                  return (
                    <View style={{ width: 56, height: 56, backgroundColor: '#3B82F6', borderRadius: 28, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>EA</Text>
                    </View>
                  );
                }}
              />
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>EASE ACADEMY</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={{ flexDirection: 'row' }}>
              {/* Student Photo */}
              <View style={styles.photoContainer}>
                {student.profilePhoto?.url ? (
                  <Image style={styles.photo} src={student.profilePhoto.url} />
                ) : (
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Photo</Text>
                )}
              </View>

              {/* Student Details */}
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{studentName}</Text>
                <Text style={styles.infoText}>
                  <Text style={{ fontWeight: 'bold' }}>Class: </Text>
                  {studentClass}
                </Text>
                <Text style={styles.infoTextBold}>
                  <Text style={{ fontWeight: 'normal', color: '#374151' }}>ID: </Text>
                  {studentId}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={{ fontWeight: 'bold' }}>Gender: </Text>
                  {student.gender}
                </Text>
              </View>
            </View>

            {/* QR Code */}
            <View style={styles.qrContainer}>
              {qrCodeUrl ? (
                <Image style={styles.qrCode} src={qrCodeUrl} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 9, color: '#6B7280' }}>QR CODE</Text>
                  <Text style={{ fontSize: 7, color: '#9CA3AF' }}>(Scan for details)</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Accent */}
          <View style={styles.bottomAccent} />
        </View>

        {/* Fold Line */}
        <View style={{ width: 20, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 1, height: '100%', backgroundColor: '#9CA3AF' }} />
          <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 8, transform: 'rotate(-90deg)' }}>FOLD HERE</Text>
        </View>

        {/* Back Side */}
        <View style={[styles.card, styles.backSide]}>
          {/* Right Border Gradient */}
          <View style={styles.rightBorder} />

          {/* Header */}
          <View style={styles.header}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                style={styles.logo}
                src="/easeacademy_logo.jpg"
                // Fallback if image fails
                onError={() => {
                  return (
                    <View style={{ width: 56, height: 56, backgroundColor: '#3B82F6', borderRadius: 28, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>EA</Text>
                    </View>
                  );
                }}
              />
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>EASE ACADEMY</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.backContent}>
            {/* Student Details Section */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Student Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Father:</Text>
                <Text style={styles.detailValue}>{fatherName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>DOB:</Text>
                <Text style={styles.detailValue}>{dob}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Blood Group:</Text>
                <Text style={styles.detailValue}>{bloodGroup}</Text>
              </View>
            </View>

            {/* Important Information Section */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Important Information</Text>
              <Text style={styles.infoList}>• This card is non-transferable</Text>
              <Text style={styles.infoList}>• Must be carried at all times</Text>
              <Text style={styles.infoList}>• Report loss immediately to office</Text>
              <Text style={styles.infoList}>• Valid for academic year only</Text>
            </View>

            {/* Signature Section */}
            <View style={styles.signatureSection}>
              <Text style={styles.signatureLabel}>Authorized Signature</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>

          {/* Bottom Accent */}
          <View style={styles.bottomAccent} />
        </View>
      </Page>
    </Document>
  );
};

export default StudentCardPDF;
