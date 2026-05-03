/**
 * قواعد وإعدادات نظام الحضور والانصراف
 * Attendance System Rules & Configuration
 */

export const attendanceRules = {
  // قواعد الحضور الأساسية
  lateArrival: {
    // هل يحسب التأخير بعد فترة السماح مباشرة؟
    calculateImmediatelyAfterGracePeriod: true,
    description: "يتم تصنيف الموظف كمتأخر فوراً عند انتهاء فترة السماح",
    implementation: {
      checkIn: "If (actualTime > shiftStart + gracePeriod) -> Status: LATE",
      notification: "يتم إرسال تنبيه للمشرف عند تسجيل تأخير",
      penalty: "يتم تسجيل التأخير في الملف الشخصي"
    }
  },

  // تسجيل الانصراف
  checkOut: {
    // هل يسمح بتسجيل الانصراف خارج الموقع؟
    requireWithinLocationRadius: true,
    allowOutsideLocation: false,
    description: "يجب أن يكون الموظف داخل نطاق الموقع لتسجيل الانصراف",
    implementation: {
      validation: "IF (distance > location.radius) THEN DENY_CHECKOUT",
      error: "خطأ: يجب أن تكون داخل نطاق الموقع",
      allowance: "لا توجد استثناءات - قاعدة صارمة"
    }
  },

  // عدد مرات الحضور اليومي
  dailyCheckIns: {
    // هل يسمح بتسجيل حضور واحد فقط يوميًا أم أكثر من فترة؟
    allowMultipleCheckIns: true,
    allowedType: "multiple",
    description: "يسمح بتسجيل الحضور والانصراف أكثر من مرة في اليوم",
    useCase: [
      "موظف يعمل في وردية صباحية وأخرى مسائية في نفس اليوم",
      "موظف يترك الموقع ويعود مرة أخرى",
      "أنظمة الإجازات المقسمة"
    ],
    implementation: {
      tracking: "تتبع كل حضور وانصراف بشكل منفصل",
      reporting: "تقارير يومية تظهر جميع الحضورات والانصرافات",
      calculation: "حساب إجمالي ساعات العمل من جميع الفترات"
    }
  },

  // تصحيح الحضور
  correctionRequests: {
    // هل يحتاج الموظف إلى موافقة عند تصحيح الحضور؟
    requiresApproval: true,
    approvers: ["supervisor", "manager"],
    description: "يجب أن يحصل طلب تصحيح الحضور على موافقة من المشرف أو المدير",
    workflow: {
      step1: "الموظف يرسل طلب تصحيح حضور مع سبب واضح",
      step2: "يتم إرسال إشعار للمشرف المباشر",
      step3: "المشرف يراجع الطلب ويقرر القبول أو الرفض",
      step4: "إذا رُفض، يرى الموظف السبب",
      step5: "إذا قُبل، يتم تحديث سجل الحضور"
    },
    requirements: {
      reason: "يجب تقديم سبب واضح للتصحيح",
      documents: "يمكن إرفاق مستندات دعم",
      timeLimit: "يجب تقديم الطلب خلال أيام معينة من التاريخ"
    },
    types: [
      "تصحيح وقت الحضور",
      "إضافة حضور مفقود",
      "تغيير حالة الحضور (من متأخر إلى حاضر مثلاً)"
    ]
  },

  // الأيام العطلة
  holidays: {
    // هل هناك أيام عطلات أسبوعية أو رسمية يجب تجاهلها في التقارير؟
    ignoreWeekends: true,
    ignorePublicHolidays: true,
    description: "يتم استبعاد الأيام العطلة الأسبوعية والرسمية من التقارير والحسابات",
    weekends: {
      days: ["الجمعة", "السبت"],
      treatment: "لا يتم احتساب الغياب أو التأخير",
      statusInReports: "عطلة نهاية أسبوع"
    },
    publicHolidays: {
      inclusion: "قائمة بجميع الأيام الرسمية والعطلات",
      treatment: "يتم استبعاد من التقارير الشهرية والسنوية",
      notification: "يجب تحديث قائمة العطلات في نظام الإدارة",
      examples: [
        "رمضان وعيد الفطر وعيد الأضحى",
        "اليوم الوطني",
        "أيام عطلة إضافية حسب الشركة"
      ]
    },
    reporting: {
      monthlyReport: "يتم حساب أيام العمل الفعلية = أيام الشهر - عطلات",
      attendancePercentage: "بناءً على أيام العمل الفعلية فقط",
      leaveCalculation: "الإجازات تُحسب من أيام العمل فقط"
    }
  }
};

export const attendanceStatus = {
  present: {
    code: "PRESENT",
    ar: "حاضر",
    description: "تم التحقق من الحضور في الوقت المحدد"
  },
  late: {
    code: "LATE",
    ar: "متأخر",
    description: "تم التحقق من الحضور بعد انتهاء فترة السماح",
    penalty: "يتم تسجيل التأخير وقد يترتب عليه خصم"
  },
  absent: {
    code: "ABSENT",
    ar: "غائب",
    description: "لم يتم التحقق من الحضور في يوم العمل"
  },
  halfDay: {
    code: "HALF_DAY",
    ar: "نصف يوم",
    description: "الموظف حاضر لجزء من اليوم فقط"
  },
  leave: {
    code: "ON_LEAVE",
    ar: "إجازة",
    description: "الموظف في إجازة رسمية",
    types: ["سنوية", "مرضية", "استثنائية", "بدون راتب"]
  },
  earlyCheckOut: {
    code: "EARLY_CHECKOUT",
    ar: "انصراف مبكر",
    description: "الموظف انصرف قبل الوقت المحدد"
  },
  pending: {
    code: "PENDING",
    ar: "قيد المراجعة",
    description: "طلب تصحيح تحت المراجعة"
  }
};

export const attendanceConfig = {
  defaultGracePeriodMinutes: 15,
  maxDailyCheckIns: null, // unlimited
  correctionRequestExpirationDays: 7,
  
  locationBasedCheckin: {
    enabled: true,
    requireGPS: true,
    allowFallbackToIP: false
  },

  notifications: {
    lateArrival: {
      enabled: true,
      notifyTo: ["supervisor", "manager"],
      timing: "immediate"
    },
    
    absentNotification: {
      enabled: true,
      notifyTo: ["manager", "hr"],
      timing: "end of day"
    },

    correctionRequestNotification: {
      enabled: true,
      notifyTo: ["supervisor", "manager"],
      timing: "immediate"
    }
  },

  reporting: {
    excludeWeekends: true,
    excludePublicHolidays: true,
    
    metrics: [
      "attendance_percentage",
      "late_arrivals_count",
      "early_checkouts_count",
      "absent_days_count",
      "average_late_minutes"
    ],

    reportingPeriods: [
      "daily",
      "weekly",
      "monthly",
      "quarterly",
      "yearly"
    ]
  },

  exportFormats: ["pdf", "excel", "csv"]
};

export const implementationNotes = {
  summary: `
    نظام الحضور والانصراف مُعد للعمل بالقواعد التالية:
    
    1. التأخير: يُحسب فوراً عند انتهاء فترة السماح
    2. الانصراف: يجب أن يكون داخل نطاق الموقع
    3. عدد الحضورات: متعدد يومياً (يسمح بأكثر من حضور)
    4. التصحيح: يتطلب موافقة من المشرف/المدير
    5. العطلات: يتم استبعاد الأسبوعية والرسمية من التقارير
  `,
  
  nextSteps: [
    "إضافة قائمة بالأيام الرسمية والعطلات",
    "تحديد أيام الأسبوع الخاصة بكل موقع (قد تختلف)",
    "تحديد فترات السماح لكل وردية",
    "إعداد عملية الموافقة على تصحيح الحضور",
    "تكوين قنوات التنبيهات (بريد، تطبيق، إلخ)"
  ]
};
