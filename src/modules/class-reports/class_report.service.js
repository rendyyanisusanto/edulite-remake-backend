'use strict';
const db = require('../../models');
const pdfService = require('../../services/pdfService');
const classSetupService = require('../class-setup/class_setup.service');
const classReportLayout = require('../../templates/classReports/classReportLayout');

const { StudentClassHistory, Student, Class, Teacher, Grade, Department, AcademicYear, SchoolProfile } = db;

class ClassReportService {
  async getClassReportData(academic_year_id, class_id) {
    // Get class detail with homeroom teacher
    const classDetail = await classSetupService.getRombelDetail(academic_year_id, class_id);

    // Get all students in the class (without pagination for report)
    const studentsData = await classSetupService.getRombelStudents(
      academic_year_id,
      class_id,
      { search: '', page: 1, limit: 1000 }
    );

    // Get school profile
    const schoolProfile = await SchoolProfile.findOne();

    // Get homeroom teacher with photo
    let homeroomTeacher = null;
    if (classDetail.homeroom_teacher?.id) {
      homeroomTeacher = await Teacher.findByPk(classDetail.homeroom_teacher.id, {
        attributes: ['id', 'full_name', 'nip', 'position', 'photo']
      });
    }

    return {
      class_info: classDetail,
      students: studentsData.students || [],
      total_students: studentsData.totalItems || 0,
      school_profile: schoolProfile || {},
      homeroom_teacher: homeroomTeacher,
      print_date: new Date().toLocaleString('id-ID')
    };
  }

  async renderReport(academic_year_id, class_id, mode) {
    const data = await this.getClassReportData(academic_year_id, class_id);

    // Build HTML content
    const html = classReportLayout({
      title: 'Laporan Siswa Per Kelas',
      schoolProfile: data.school_profile,
      classInfo: data.class_info,
      homeroomTeacher: data.homeroom_teacher,
      students: data.students,
      totalStudents: data.total_students,
      printDate: data.print_date,
      showToolbar: mode === 'preview',
      pdfUrl: `/api/v1/class-reports/${class_id}/pdf?academic_year_id=${academic_year_id}`
    });

    if (mode === 'preview') {
      return { type: 'html', content: html };
    }

    const pdf = await pdfService.renderHtmlToPdf(html, {
      format: 'A4',
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      printBackground: true
    });

    return { type: 'pdf', content: pdf };
  }
}

module.exports = new ClassReportService();
