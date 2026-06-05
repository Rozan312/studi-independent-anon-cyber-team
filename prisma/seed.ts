import { PrismaClient, Role, AnswerType, AnnouncementAudience, ClassMemberRole, LeaderboardSourceType, ProgressStatus, LabStatus } from "@prisma/client";

const prisma = new PrismaClient();

const users = {
  student: "00000000-0000-4000-8000-000000000101",
  instructor: "00000000-0000-4000-8000-000000000102",
  admin: "00000000-0000-4000-8000-000000000103"
};

type RoomSeed = {
  pathSlug: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  points: number;
  orderIndex: number;
  tasks: Array<{
    title: string;
    description: string;
    answerType: AnswerType;
    expectedAnswer: string;
    points: number;
  }>;
  quiz: {
    title: string;
    description: string;
    passingScore: number;
    questions: Array<{
      question: string;
      explanation: string;
      options: Array<{ label: string; isCorrect: boolean }>;
    }>;
  };
};

const learningPaths = [
  {
    title: "Cybersecurity Fundamentals",
    slug: "cybersecurity-fundamentals",
    description: "A safe introduction to core security concepts, responsible learning, and defensive thinking.",
    category: "Foundations",
    difficulty: "Beginner",
    estimatedHours: 8
  },
  {
    title: "Linux Fundamentals",
    slug: "linux-fundamentals",
    description: "Conceptual Linux environment knowledge for learners who need a safe command-line foundation.",
    category: "Foundations",
    difficulty: "Beginner",
    estimatedHours: 10
  },
  {
    title: "Networking Basics",
    slug: "networking-basics",
    description: "Networking concepts, protocols, and traffic interpretation for secure operations.",
    category: "Networking",
    difficulty: "Beginner",
    estimatedHours: 9
  },
  {
    title: "Web Security Fundamentals",
    slug: "web-security-fundamentals",
    description: "Safe review of web application security principles using toy examples and defensive language.",
    category: "Application Security",
    difficulty: "Beginner",
    estimatedHours: 12
  },
  {
    title: "SOC Analyst Level 1",
    slug: "soc-analyst-level-1",
    description: "Alert triage, log review, and incident documentation for entry-level blue-team workflows.",
    category: "Blue Team",
    difficulty: "Intermediate",
    estimatedHours: 16
  },
  {
    title: "Blue Team Fundamentals",
    slug: "blue-team-fundamentals",
    description: "Defensive security operations, monitoring strategy, and incident readiness.",
    category: "Blue Team",
    difficulty: "Beginner",
    estimatedHours: 14
  },
  {
    title: "Red Team Concepts",
    slug: "red-team-concepts",
    description: "Ethical, policy-bound overview of adversary emulation concepts without operational procedures.",
    category: "Security Concepts",
    difficulty: "Intermediate",
    estimatedHours: 10
  },
  {
    title: "Cloud Security Basics",
    slug: "cloud-security-basics",
    description: "Cloud identity, configuration review, and shared-responsibility fundamentals.",
    category: "Cloud",
    difficulty: "Beginner",
    estimatedHours: 10
  },
  {
    title: "Digital Forensics Basics",
    slug: "digital-forensics-basics",
    description: "Evidence handling, timeline reasoning, and basic forensic reporting.",
    category: "Forensics",
    difficulty: "Beginner",
    estimatedHours: 11
  },
  {
    title: "Secure Coding Basics",
    slug: "secure-coding-basics",
    description: "Secure design, validation, authorization, and safe coding review habits.",
    category: "Secure Development",
    difficulty: "Beginner",
    estimatedHours: 13
  }
];

const rooms: RoomSeed[] = [
  {
    pathSlug: "cybersecurity-fundamentals",
    title: "Introduction to HTTP",
    slug: "introduction-to-http",
    description: "Learn how HTTP requests, responses, methods, and status codes support normal web applications.",
    category: "Web",
    difficulty: "Beginner",
    estimatedMinutes: 45,
    points: 120,
    orderIndex: 1,
    tasks: [
      {
        title: "Identify a successful response code",
        description: "Read the safe sample response summary and identify the status code family that means success.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "2xx",
        points: 20
      },
      {
        title: "Map request and response responsibilities",
        description: "Choose the concept that best describes data sent from a browser to a server.",
        answerType: AnswerType.MULTIPLE_CHOICE,
        expectedAnswer: "request",
        points: 25
      }
    ],
    quiz: {
      title: "HTTP Basics Check",
      description: "Confirm understanding of safe HTTP fundamentals.",
      passingScore: 70,
      questions: [
        {
          question: "Which status-code group usually indicates success?",
          explanation: "Successful HTTP responses are represented by the 2xx family.",
          options: [
            { label: "2xx", isCorrect: true },
            { label: "4xx", isCorrect: false },
            { label: "5xx", isCorrect: false }
          ]
        },
        {
          question: "Which HTTP component contains metadata such as content type?",
          explanation: "Headers carry metadata about the request or response.",
          options: [
            { label: "Headers", isCorrect: true },
            { label: "Hostname only", isCorrect: false },
            { label: "Window title", isCorrect: false }
          ]
        }
      ]
    }
  },
  {
    pathSlug: "linux-fundamentals",
    title: "Linux Command Line Basics",
    slug: "linux-command-line-basics",
    description: "Explore shell concepts, file permissions, and operational hygiene with non-operational examples.",
    category: "Linux",
    difficulty: "Beginner",
    estimatedMinutes: 55,
    points: 130,
    orderIndex: 1,
    tasks: [
      {
        title: "Recognize least privilege",
        description: "Identify the security principle that recommends granting only the access required for a task.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "least privilege",
        points: 25
      },
      {
        title: "Understand permission categories",
        description: "Name the broad account category that should be avoided for routine daily work.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "administrator",
        points: 25
      }
    ],
    quiz: {
      title: "Linux Safety Check",
      description: "Review safe system-use concepts.",
      passingScore: 70,
      questions: [
        {
          question: "Why should privileged access be limited?",
          explanation: "Limited privileges reduce accidental damage and reduce the impact of mistakes.",
          options: [
            { label: "It reduces unnecessary risk", isCorrect: true },
            { label: "It disables authentication", isCorrect: false },
            { label: "It removes audit logs", isCorrect: false }
          ]
        },
        {
          question: "Which habit supports safe lab work?",
          explanation: "Documenting actions improves repeatability and accountability.",
          options: [
            { label: "Document observations and changes", isCorrect: true },
            { label: "Ignore scope boundaries", isCorrect: false },
            { label: "Use production systems for practice", isCorrect: false }
          ]
        }
      ]
    }
  },
  {
    pathSlug: "web-security-fundamentals",
    title: "Authentication Concepts",
    slug: "authentication-concepts",
    description: "Understand identity verification, session safety, and defensive account controls.",
    category: "Web",
    difficulty: "Beginner",
    estimatedMinutes: 50,
    points: 140,
    orderIndex: 1,
    tasks: [
      {
        title: "Separate authentication and authorization",
        description: "Enter the term for confirming who a user is.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "authentication",
        points: 30
      },
      {
        title: "Recognize account protection",
        description: "Choose the control that adds a second verification factor.",
        answerType: AnswerType.MULTIPLE_CHOICE,
        expectedAnswer: "multi-factor authentication",
        points: 30
      }
    ],
    quiz: {
      title: "Authentication Concepts Quiz",
      description: "Validate identity and account-safety concepts.",
      passingScore: 70,
      questions: [
        {
          question: "What does authentication verify?",
          explanation: "Authentication verifies identity.",
          options: [
            { label: "Who the user is", isCorrect: true },
            { label: "Which page has the best layout", isCorrect: false },
            { label: "How many rooms exist", isCorrect: false }
          ]
        },
        {
          question: "What is a common defensive benefit of multi-factor authentication?",
          explanation: "A second factor reduces reliance on a password alone.",
          options: [
            { label: "It adds another verification step", isCorrect: true },
            { label: "It publishes user data", isCorrect: false },
            { label: "It removes account recovery", isCorrect: false }
          ]
        }
      ]
    }
  },
  {
    pathSlug: "web-security-fundamentals",
    title: "Broken Access Control Basics",
    slug: "broken-access-control-basics",
    description: "Learn how authorization mistakes happen and how to review them safely with toy scenarios.",
    category: "Web",
    difficulty: "Beginner",
    estimatedMinutes: 60,
    points: 160,
    orderIndex: 2,
    tasks: [
      {
        title: "Identify authorization",
        description: "Enter the term for deciding what an authenticated user may access.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "authorization",
        points: 35
      },
      {
        title: "Review safe object access",
        description: "Identify the defensive control that verifies resource ownership on the server.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "server-side authorization",
        points: 35
      }
    ],
    quiz: {
      title: "Access Control Review",
      description: "Check defensive authorization understanding.",
      passingScore: 75,
      questions: [
        {
          question: "Where should access-control decisions be enforced?",
          explanation: "Server-side enforcement prevents client-side tampering from bypassing checks.",
          options: [
            { label: "On the server", isCorrect: true },
            { label: "Only in button styling", isCorrect: false },
            { label: "Only in browser bookmarks", isCorrect: false }
          ]
        },
        {
          question: "What should a system check before returning a private object?",
          explanation: "The system should confirm the requester is allowed to access that object.",
          options: [
            { label: "Authorization for that resource", isCorrect: true },
            { label: "The user's display theme", isCorrect: false },
            { label: "The local screen size", isCorrect: false }
          ]
        }
      ]
    }
  },
  {
    pathSlug: "soc-analyst-level-1",
    title: "Log Analysis Fundamentals",
    slug: "log-analysis-fundamentals",
    description: "Practice reading sanitized log summaries and distinguishing normal activity from anomalies.",
    category: "SOC",
    difficulty: "Intermediate",
    estimatedMinutes: 70,
    points: 180,
    orderIndex: 1,
    tasks: [
      {
        title: "Identify a timestamp",
        description: "Select the field type that helps analysts order events in a timeline.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "timestamp",
        points: 30
      },
      {
        title: "Classify an event",
        description: "Choose the label for an event that deserves review but is not confirmed harmful.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "suspicious",
        points: 30
      }
    ],
    quiz: {
      title: "Log Review Quiz",
      description: "Validate log triage concepts.",
      passingScore: 70,
      questions: [
        {
          question: "Why are timestamps important in incident review?",
          explanation: "Timestamps help build event timelines.",
          options: [
            { label: "They help order events", isCorrect: true },
            { label: "They remove the need for evidence", isCorrect: false },
            { label: "They replace authentication", isCorrect: false }
          ]
        },
        {
          question: "What should an analyst do with uncertain events?",
          explanation: "Uncertain events should be documented and escalated based on process.",
          options: [
            { label: "Document and triage them", isCorrect: true },
            { label: "Delete them immediately", isCorrect: false },
            { label: "Ignore them permanently", isCorrect: false }
          ]
        }
      ]
    }
  },
  {
    pathSlug: "networking-basics",
    title: "Network Traffic Basics",
    slug: "network-traffic-basics",
    description: "Understand high-level traffic flows, ports, protocols, and safe packet metadata review.",
    category: "Networking",
    difficulty: "Beginner",
    estimatedMinutes: 50,
    points: 130,
    orderIndex: 1,
    tasks: [
      {
        title: "Recognize protocol purpose",
        description: "Enter the term for agreed rules that systems use to communicate.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "protocol",
        points: 25
      },
      {
        title: "Identify network metadata",
        description: "Name the concept used to identify a service endpoint on a host.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "port",
        points: 25
      }
    ],
    quiz: {
      title: "Network Basics Quiz",
      description: "Review network communication concepts.",
      passingScore: 70,
      questions: [
        {
          question: "What is a protocol?",
          explanation: "A protocol is a set of communication rules.",
          options: [
            { label: "A set of communication rules", isCorrect: true },
            { label: "A user profile image", isCorrect: false },
            { label: "A database row only", isCorrect: false }
          ]
        },
        {
          question: "What does a port help identify?",
          explanation: "Ports identify service endpoints on a host.",
          options: [
            { label: "A service endpoint", isCorrect: true },
            { label: "A screen color", isCorrect: false },
            { label: "A public ranking only", isCorrect: false }
          ]
        }
      ]
    }
  },
  {
    pathSlug: "blue-team-fundamentals",
    title: "Security Monitoring Basics",
    slug: "security-monitoring-basics",
    description: "Learn alert queues, severity, signal quality, and escalation in a defensive environment.",
    category: "Blue Team",
    difficulty: "Beginner",
    estimatedMinutes: 60,
    points: 150,
    orderIndex: 1,
    tasks: [
      {
        title: "Define alert triage",
        description: "Enter the term for prioritizing and reviewing incoming security alerts.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "triage",
        points: 30
      },
      {
        title: "Identify escalation",
        description: "Name the process of passing an alert to a more specialized responder.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "escalation",
        points: 30
      }
    ],
    quiz: {
      title: "Monitoring Concepts Quiz",
      description: "Review safe monitoring workflow fundamentals.",
      passingScore: 70,
      questions: [
        {
          question: "What does triage help analysts decide?",
          explanation: "Triage helps prioritize review and response.",
          options: [
            { label: "Priority and next action", isCorrect: true },
            { label: "Page background color", isCorrect: false },
            { label: "Whether to skip documentation", isCorrect: false }
          ]
        },
        {
          question: "Why is severity useful?",
          explanation: "Severity helps teams allocate attention and response effort.",
          options: [
            { label: "It supports prioritization", isCorrect: true },
            { label: "It removes all false positives", isCorrect: false },
            { label: "It disables access control", isCorrect: false }
          ]
        }
      ]
    }
  },
  {
    pathSlug: "blue-team-fundamentals",
    title: "Incident Response Basics",
    slug: "incident-response-basics",
    description: "Explore preparation, containment, communication, and lessons learned for defensive response.",
    category: "Blue Team",
    difficulty: "Beginner",
    estimatedMinutes: 65,
    points: 170,
    orderIndex: 2,
    tasks: [
      {
        title: "Identify preparation",
        description: "Name the incident-response phase focused on readiness before an event.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "preparation",
        points: 30
      },
      {
        title: "Recognize documentation",
        description: "Enter the activity that preserves decisions, observations, and timelines.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "documentation",
        points: 30
      }
    ],
    quiz: {
      title: "Incident Response Quiz",
      description: "Validate response lifecycle concepts.",
      passingScore: 70,
      questions: [
        {
          question: "Which phase happens before an incident?",
          explanation: "Preparation establishes playbooks, contacts, and readiness.",
          options: [
            { label: "Preparation", isCorrect: true },
            { label: "Guesswork", isCorrect: false },
            { label: "Public posting", isCorrect: false }
          ]
        },
        {
          question: "Why are lessons learned useful?",
          explanation: "They improve controls and procedures after response work.",
          options: [
            { label: "They improve future readiness", isCorrect: true },
            { label: "They remove the need for policies", isCorrect: false },
            { label: "They hide evidence", isCorrect: false }
          ]
        }
      ]
    }
  },
  {
    pathSlug: "secure-coding-basics",
    title: "Secure Password Policy",
    slug: "secure-password-policy",
    description: "Review password policy design, account recovery, and safe user guidance.",
    category: "Secure Development",
    difficulty: "Beginner",
    estimatedMinutes: 45,
    points: 120,
    orderIndex: 1,
    tasks: [
      {
        title: "Recognize password storage",
        description: "Enter the defensive process used to transform passwords before storage.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "hashing",
        points: 25
      },
      {
        title: "Identify recovery safety",
        description: "Name the principle of validating account recovery requests before changing credentials.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "identity verification",
        points: 25
      }
    ],
    quiz: {
      title: "Password Policy Quiz",
      description: "Review safe account-control concepts.",
      passingScore: 70,
      questions: [
        {
          question: "Why should passwords not be stored as plain text?",
          explanation: "Protected storage reduces risk if a database is exposed.",
          options: [
            { label: "Protected storage reduces exposure risk", isCorrect: true },
            { label: "It improves button color", isCorrect: false },
            { label: "It makes login impossible", isCorrect: false }
          ]
        },
        {
          question: "What should account recovery verify?",
          explanation: "Recovery should verify identity before allowing sensitive changes.",
          options: [
            { label: "The requester's identity", isCorrect: true },
            { label: "The user's favorite theme", isCorrect: false },
            { label: "A public ranking only", isCorrect: false }
          ]
        }
      ]
    }
  },
  {
    pathSlug: "secure-coding-basics",
    title: "Web Application Security Review",
    slug: "web-application-security-review",
    description: "Practice a safe review checklist for validation, authentication, authorization, and logging.",
    category: "Secure Development",
    difficulty: "Beginner",
    estimatedMinutes: 75,
    points: 180,
    orderIndex: 2,
    tasks: [
      {
        title: "Identify validation",
        description: "Enter the process of checking data shape before using it.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "validation",
        points: 30
      },
      {
        title: "Recognize audit logging",
        description: "Name the defensive record that helps review important actions later.",
        answerType: AnswerType.TEXT,
        expectedAnswer: "audit log",
        points: 30
      }
    ],
    quiz: {
      title: "Security Review Quiz",
      description: "Validate defensive application review concepts.",
      passingScore: 75,
      questions: [
        {
          question: "What does input validation check?",
          explanation: "Validation confirms data follows expected type, size, and format rules.",
          options: [
            { label: "Data type, size, and format", isCorrect: true },
            { label: "Only the user's avatar", isCorrect: false },
            { label: "Only page animation", isCorrect: false }
          ]
        },
        {
          question: "Why are audit logs important?",
          explanation: "Audit logs support accountability and investigation.",
          options: [
            { label: "They support accountability", isCorrect: true },
            { label: "They replace authorization", isCorrect: false },
            { label: "They publish secrets", isCorrect: false }
          ]
        }
      ]
    }
  }
];

async function seedProfiles() {
  await prisma.profile.upsert({
    where: { id: users.student },
    update: {},
    create: {
      id: users.student,
      email: "student@example.local",
      fullName: "Rozaan Student",
      username: "rozaan",
      role: Role.STUDENT
    }
  });

  await prisma.profile.upsert({
    where: { id: users.instructor },
    update: {},
    create: {
      id: users.instructor,
      email: "instructor@example.local",
      fullName: "Anon Instructor",
      username: "anon-instructor",
      role: Role.INSTRUCTOR
    }
  });

  await prisma.profile.upsert({
    where: { id: users.admin },
    update: {},
    create: {
      id: users.admin,
      email: "admin@example.local",
      fullName: "Platform Admin",
      username: "platform-admin",
      role: Role.ADMIN
    }
  });
}

async function seedLearningPathsAndRooms() {
  const pathBySlug = new Map<string, { id: string }>();

  for (const path of learningPaths) {
    const record = await prisma.learningPath.upsert({
      where: { slug: path.slug },
      update: { ...path, isPublished: true },
      create: { ...path, isPublished: true }
    });
    pathBySlug.set(path.slug, record);
  }

  for (const roomSeed of rooms) {
    const learningPath = pathBySlug.get(roomSeed.pathSlug);
    if (!learningPath) {
      throw new Error(`Missing learning path for ${roomSeed.pathSlug}`);
    }

    const room = await prisma.room.upsert({
      where: { slug: roomSeed.slug },
      update: {
        learningPathId: learningPath.id,
        title: roomSeed.title,
        description: roomSeed.description,
        category: roomSeed.category,
        difficulty: roomSeed.difficulty,
        estimatedMinutes: roomSeed.estimatedMinutes,
        points: roomSeed.points,
        orderIndex: roomSeed.orderIndex,
        isPublished: true
      },
      create: {
        learningPathId: learningPath.id,
        title: roomSeed.title,
        slug: roomSeed.slug,
        description: roomSeed.description,
        category: roomSeed.category,
        difficulty: roomSeed.difficulty,
        estimatedMinutes: roomSeed.estimatedMinutes,
        points: roomSeed.points,
        orderIndex: roomSeed.orderIndex,
        isPublished: true
      }
    });

    await prisma.quiz.deleteMany({ where: { roomId: room.id } });
    await prisma.roomTask.deleteMany({ where: { roomId: room.id } });

    for (const [index, task] of roomSeed.tasks.entries()) {
      await prisma.roomTask.create({
        data: {
          roomId: room.id,
          title: task.title,
          description: task.description,
          orderIndex: index + 1,
          answerType: task.answerType,
          expectedAnswer: task.expectedAnswer,
          points: task.points
        }
      });
    }

    await prisma.quiz.create({
      data: {
        roomId: room.id,
        title: roomSeed.quiz.title,
        description: roomSeed.quiz.description,
        passingScore: roomSeed.quiz.passingScore,
        questions: {
          create: roomSeed.quiz.questions.map((question, questionIndex) => ({
            question: question.question,
            explanation: question.explanation,
            orderIndex: questionIndex + 1,
            options: {
              create: question.options
            }
          }))
        }
      }
    });
  }
}

async function seedClassAndProgress() {
  const classRecord = await prisma.class.upsert({
    where: { id: "00000000-0000-4000-8000-000000000201" },
    update: {
      name: "SI-ACT Cohort Alpha",
      description: "Sample instructor-led cohort for local development."
    },
    create: {
      id: "00000000-0000-4000-8000-000000000201",
      name: "SI-ACT Cohort Alpha",
      description: "Sample instructor-led cohort for local development.",
      instructorId: users.instructor
    }
  });

  await prisma.classMember.upsert({
    where: {
      classId_userId: {
        classId: classRecord.id,
        userId: users.student
      }
    },
    update: { role: ClassMemberRole.STUDENT },
    create: {
      classId: classRecord.id,
      userId: users.student,
      role: ClassMemberRole.STUDENT
    }
  });

  const firstRoom = await prisma.room.findUnique({ where: { slug: "introduction-to-http" } });
  if (!firstRoom) return;

  await prisma.userRoomProgress.upsert({
    where: {
      userId_roomId: {
        userId: users.student,
        roomId: firstRoom.id
      }
    },
    update: {
      status: ProgressStatus.IN_PROGRESS,
      progressPercentage: 50,
      startedAt: new Date()
    },
    create: {
      userId: users.student,
      roomId: firstRoom.id,
      status: ProgressStatus.IN_PROGRESS,
      progressPercentage: 50,
      startedAt: new Date()
    }
  });

  await prisma.labSession.create({
    data: {
      userId: users.student,
      roomId: firstRoom.id,
      status: LabStatus.READY
    }
  });
}

async function seedAnnouncementsAndLeaderboard() {
  await prisma.announcement.upsert({
    where: { id: "00000000-0000-4000-8000-000000000301" },
    update: {
      title: "Responsible Lab Use",
      content:
        "All labs are educational placeholders. Work only inside authorized training environments, avoid real targets, and document observations responsibly.",
      audience: AnnouncementAudience.ALL,
      isPublished: true
    },
    create: {
      id: "00000000-0000-4000-8000-000000000301",
      title: "Responsible Lab Use",
      content:
        "All labs are educational placeholders. Work only inside authorized training environments, avoid real targets, and document observations responsibly.",
      audience: AnnouncementAudience.ALL,
      createdById: users.admin,
      isPublished: true
    }
  });

  await prisma.announcement.upsert({
    where: { id: "00000000-0000-4000-8000-000000000302" },
    update: {
      title: "New Web Security Path",
      content: "The Web Security Fundamentals path is available with safe, defensive review exercises.",
      audience: AnnouncementAudience.STUDENT,
      isPublished: true
    },
    create: {
      id: "00000000-0000-4000-8000-000000000302",
      title: "New Web Security Path",
      content: "The Web Security Fundamentals path is available with safe, defensive review exercises.",
      audience: AnnouncementAudience.STUDENT,
      createdById: users.instructor,
      isPublished: true
    }
  });

  await prisma.leaderboardPoint.deleteMany({
    where: {
      userId: { in: [users.student, users.instructor] },
      sourceType: LeaderboardSourceType.MANUAL_ADJUSTMENT,
      sourceId: { in: ["seed:student-baseline", "seed:instructor-demo"] }
    }
  });

  await prisma.leaderboardPoint.createMany({
    data: [
      {
        userId: users.student,
        points: 250,
        sourceType: LeaderboardSourceType.MANUAL_ADJUSTMENT,
        sourceId: "seed:student-baseline"
      },
      {
        userId: users.instructor,
        points: 120,
        sourceType: LeaderboardSourceType.MANUAL_ADJUSTMENT,
        sourceId: "seed:instructor-demo"
      }
    ]
  });
}

async function main() {
  await seedProfiles();
  await seedLearningPathsAndRooms();
  await seedClassAndProgress();
  await seedAnnouncementsAndLeaderboard();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
