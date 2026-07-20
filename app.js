(() => {
  "use strict";

  const STORAGE_KEYS = {
    student: "jobDocBuilder.studentData.v1",
    template: "jobDocBuilder.templateSettings.v1",
  };

  const DEFAULT_ESSAYS = [
    {
      title: "지원 동기",
      guide:
        "왜 이 직무를 선택했는지, 어떤 경험 때문에 관심을 갖게 되었는지 적어 보세요.",
    },
    {
      title: "직무 관련 강점",
      guide: "성격 장점보다는 실제 업무에 도움이 되는 강점을 적어 보세요.",
    },
    {
      title: "프로젝트 또는 협업 경험",
      guide: "내가 맡은 역할, 실제로 한 일, 결과를 중심으로 적어 보세요.",
    },
    {
      title: "문제 해결 경험",
      guide: "문제 상황 → 원인 파악 → 해결 과정 → 결과 순서로 적어 보세요.",
    },
    {
      title: "입사 후 목표",
      guide: "회사에서 어떤 기획자로 성장하고 싶은지 구체적으로 적어 보세요.",
    },
  ];

  const LAYOUT_NOTES = {
    standard: "기본형: 대부분의 지원처에 무난하게 제출할 수 있는 구성입니다.",
    compact: "간결형: 작성 내용이 많을 때 여백을 줄여 더 촘촘하게 보여줍니다.",
    review: "면접관 검토형: 역할과 주요 기여가 빠르게 보이도록 강조합니다.",
    timeline: "타임라인형: 학력과 경험의 기간·흐름을 시간 순서로 빠르게 읽을 수 있습니다.",
    portfolio: "프로젝트 강조형: 프로젝트 썸네일과 결과물을 더 크게 보여주는 구성입니다.",
  };

  const SECTION_DEFINITIONS = [
    { key: "basic", label: "기본 정보" },
    { key: "education", label: "학력 / 교육 이력" },
    { key: "workExperiences", label: "인턴 / 실무 경험" },
    { key: "projects", label: "프로젝트 경험" },
    { key: "awards", label: "수상 / 공모전" },
    { key: "activities", label: "대외활동 / 기타" },
    { key: "certifications", label: "자격증 / 수료" },
    { key: "skills", label: "보유 역량" },
    { key: "essays", label: "자기소개서" },
  ];

  const dom = {
    form: document.querySelector("#document-form"),
    educationItems: document.querySelector("#education-items"),
    workExperienceItems: document.querySelector("#work-experience-items"),
    projectItems: document.querySelector("#project-items"),
    awardItems: document.querySelector("#award-items"),
    activityItems: document.querySelector("#activity-items"),
    certificationItems: document.querySelector("#certification-items"),
    skillItems: document.querySelector("#skill-items"),
    essayItems: document.querySelector("#essay-items"),
    essayPreset: document.querySelector("#essay-preset"),
    customEssayTitle: document.querySelector("#custom-essay-title"),
    photoInput: document.querySelector("#photo-upload"),
    photoInputPreview: document.querySelector("#photo-input-preview"),
    photoStatus: document.querySelector("#photo-status"),
    previewScroll: document.querySelector(".preview-scroll"),
    preview: document.querySelector("#document-preview"),
    pageCount: document.querySelector("#page-count"),
    saveStatus: document.querySelector("#save-status"),
    progressText: document.querySelector("#progress-text"),
    completionProgress: document.querySelector("#completion-progress"),
    presetNote: document.querySelector("#preset-note"),
    sectionOrderList: document.querySelector("#section-order-list"),
    refreshButton: document.querySelector("#refresh-preview"),
    resetButton: document.querySelector("#reset-data"),
    sampleButton: document.querySelector("#load-sample"),
    printButton: document.querySelector("#print-document"),
    openGuideButton: document.querySelector("#open-guide"),
    closeGuideButton: document.querySelector("#close-guide"),
    guideDialog: document.querySelector("#guide-dialog"),
  };

  let state = {
    student: createDefaultStudent(),
    template: createDefaultTemplate(),
  };
  let saveTimer = null;
  let paginationFrame = null;

  function createId(prefix) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function createEmptyEducation() {
    return {
      id: createId("education"),
      institution: "",
      course: "",
      period: "",
      grade: "",
      learning: "",
      note: "",
    };
  }

  function createEmptyWorkExperience() {
    return {
      id: createId("work"),
      organization: "",
      type: "",
      period: "",
      role: "",
      details: "",
      achievements: "",
    };
  }

  function createEmptyProject() {
    return {
      id: createId("project"),
      name: "",
      period: "",
      role: "",
      tools: "",
      summary: "",
      retrospective: "",
      image: "",
      releaseLink: "",
      contributions: ["", "", ""],
    };
  }

  function createEmptyAward() {
    return {
      id: createId("award"),
      name: "",
      organizer: "",
      period: "",
      result: "",
      role: "",
      details: "",
    };
  }

  function createEmptyActivity() {
    return {
      id: createId("activity"),
      name: "",
      organization: "",
      type: "",
      period: "",
      role: "",
      details: "",
    };
  }

  function createEmptyCertification() {
    return {
      id: createId("certification"),
      name: "",
      issuer: "",
      date: "",
      credential: "",
      details: "",
    };
  }

  function createEmptySkill() {
    return {
      id: createId("skill"),
      name: "",
      level: "",
    };
  }

  function createEmptyEssay(title = "", guide = "") {
    return {
      id: createId("essay"),
      title,
      content: "",
      guide,
    };
  }

  function createDefaultStudent() {
    return {
      basic: {
        name: "",
        email: "",
        phone: "",
        targetRole: "",
        summary: "",
        location: "",
        link: "",
        availability: "",
        birthDate: "",
        photo: "",
      },
      education: [createEmptyEducation()],
      workExperiences: [createEmptyWorkExperience()],
      projects: [createEmptyProject()],
      awards: [createEmptyAward()],
      activities: [createEmptyActivity()],
      certifications: [createEmptyCertification()],
      skills: [createEmptySkill()],
      essays: DEFAULT_ESSAYS.map((essay) =>
        createEmptyEssay(essay.title, essay.guide),
      ),
    };
  }

  function createDefaultTemplate() {
    return {
      visibility: {
        basic: true,
        education: true,
        workExperiences: true,
        projects: true,
        awards: true,
        activities: true,
        certifications: true,
        skills: true,
        essays: true,
      },
      title: "이력서 및 자기소개서",
      intro:
        "작성한 내용을 바탕으로 정리한 이력서 및 자기소개서입니다.",
      layout: "standard",
      fontSize: "medium",
      pageMargin: "preset",
      sectionSpacing: "preset",
      headingStyle: "preset",
      titleAlign: "left",
      sectionOrder: SECTION_DEFINITIONS.map((section) => section.key),
    };
  }

  function createSampleStudent() {
    return {
      basic: {
        name: "김민준",
        email: "minjun.gameplan@example.com",
        phone: "010-4821-7395",
        targetRole: "게임 시스템 기획자",
        summary: "플레이 흐름을 분석하고 규칙을 문서로 구체화하는 신입 게임 기획자",
        location: "경기도 성남시",
        link: "https://www.notion.so/example-game-planner",
        availability: "2026년 7월부터 근무 가능",
        birthDate: "2001.03.15",
        photo: "",
      },
      education: [
        {
          id: createId("education"),
          institution: "한국대학교",
          course: "디지털콘텐츠학과",
          period: "2021.03 - 2025.02",
          grade: "3.7 / 4.5",
          learning: "게임 콘텐츠 분석, 사용자 경험 설계, 기초 데이터 분석",
          note: "졸업",
        },
        {
          id: createId("education"),
          institution: "플레이랩 게임아카데미",
          course: "게임 기획 실무 부트캠프",
          period: "2025.09 - 2026.03",
          grade: "",
          learning:
            "시스템 역기획, 콘텐츠 구조 설계, UI 플로우 작성, 밸런스 데이터 테이블 제작, 팀 프로젝트 실습",
          note: "팀 프로젝트 2회 참여",
        },
      ],
      workExperiences: [
        {
          id: createId("work"),
          organization: "보드게임 카페 플레이존",
          type: "아르바이트",
          period: "2024.03 - 2024.12",
          role: "매장 운영 및 고객 응대",
          details:
            "고객 인원과 선호 장르에 맞춰 게임을 추천하고, 처음 이용하는 고객에게 규칙을 설명했습니다.",
          achievements:
            "반복 질문이 많은 게임의 설명 순서를 정리해 신규 근무자용 안내 문서를 만들었습니다.",
        },
      ],
      projects: [
        {
          id: createId("project"),
          name: "모바일 수집형 RPG 성장 시스템 기획",
          period: "2026.01 - 2026.03",
          role: "시스템 기획 / 4인 팀",
          tools: "Excel, Figma, Notion",
          summary:
            "캐릭터 성장과 장비 강화의 반복 플레이 흐름을 설계한 교육 과정 팀 프로젝트",
          retrospective:
            "처음에는 기능 범위를 넓게 잡아 문서 수정이 잦았습니다. 이후 핵심 성장 경험과 우선순위를 먼저 합의하면서 기획 범위를 정하는 과정이 중요하다는 점을 배웠습니다.",
          image: "",
          releaseLink: "https://example.com/rpg-system-project",
          contributions: [
            "캐릭터 레벨업, 승급, 장비 강화 규칙과 해금 조건을 문서화했습니다.",
            "성장 재화의 획득·소비 구조를 표로 정리하고 구간별 요구량을 계산했습니다.",
            "개발 전달을 위해 주요 화면 흐름과 예외 상황을 Figma로 정리했습니다.",
          ],
        },
        {
          id: createId("project"),
          name: "협동 퍼즐 게임 온보딩 개선안",
          period: "2025.11 - 2025.12",
          role: "콘텐츠 및 UI/UX 기획 / 3인 팀",
          tools: "Figma, Notion, Google Sheets",
          summary:
            "초반 이탈을 줄이기 위해 튜토리얼 순서와 협동 규칙 안내 방식을 개선한 프로젝트",
          retrospective:
            "적은 인원의 테스트만으로 결론을 내린 점은 아쉬웠습니다. 다음에는 테스트 질문과 관찰 기준을 먼저 정하고, 플레이 행동과 의견을 구분해 기록하겠습니다.",
          image: "",
          releaseLink: "",
          contributions: [
            "기존 튜토리얼을 단계별로 분석해 정보가 한 번에 몰리는 구간을 찾았습니다.",
            "행동 실습 후 설명이 노출되는 방식으로 튜토리얼 플로우를 재구성했습니다.",
            "5명의 테스트 의견을 분류해 안내 문구와 실패 피드백을 수정했습니다.",
          ],
        },
      ],
      awards: [
        {
          id: createId("award"),
          name: "대학생 게임 기획 공모전",
          organizer: "한국게임교육협회",
          period: "2025.08",
          result: "본선 진출",
          role: "시스템 기획 / 3인 팀",
          details:
            "협동 퍼즐 게임의 핵심 규칙과 스테이지 진행 구조를 제안했습니다.",
        },
      ],
      activities: [
        {
          id: createId("activity"),
          name: "교내 게임 분석 동아리",
          organization: "한국대학교",
          type: "동아리",
          period: "2023.03 - 2024.12",
          role: "분석 발표 및 회의 기록",
          details:
            "월 1회 라이브 게임의 시스템과 사용자 동선을 분석해 발표 자료로 정리했습니다.",
        },
      ],
      certifications: [
        {
          id: createId("certification"),
          name: "컴퓨터활용능력 2급",
          issuer: "대한상공회의소",
          date: "2024.06",
          credential: "취득",
          details: "",
        },
      ],
      skills: [
        {
          id: createId("skill"),
          name: "Figma",
          level: "UI/UX 와이어프레임과 화면 흐름 설계 가능",
        },
        {
          id: createId("skill"),
          name: "Excel / Google Sheets",
          level: "밸런스 수치표 작성과 기본 함수 활용 가능",
        },
        {
          id: createId("skill"),
          name: "시스템 기획",
          level: "규칙, 조건, 예외 상황을 기획서 형태로 정리 가능",
        },
        {
          id: createId("skill"),
          name: "Notion",
          level: "팀 문서 구조화와 일정·회의 기록 관리 가능",
        },
      ],
      essays: [
        {
          id: createId("essay"),
          title: "지원 동기",
          guide: DEFAULT_ESSAYS[0].guide,
          content:
            "게임을 플레이하며 재미를 느끼는 지점이 어떤 규칙과 보상 구조에서 만들어지는지 분석하는 과정에 흥미를 느껴 시스템 기획을 선택했습니다. 교육 과정에서 성장 시스템을 직접 문서화하며, 아이디어를 개발자가 이해할 수 있는 규칙으로 바꾸는 일에 적성이 있다는 것을 확인했습니다.",
        },
        {
          id: createId("essay"),
          title: "직무 관련 강점",
          guide: DEFAULT_ESSAYS[1].guide,
          content:
            "복잡한 내용을 표와 흐름도로 나누어 정리하는 것이 강점입니다. 팀 프로젝트에서는 성장 조건과 재화 흐름을 한 문서에서 확인할 수 있도록 구조를 통일했고, 변경된 수치가 다른 규칙에 어떤 영향을 주는지 함께 기록해 팀원의 확인 시간을 줄였습니다.",
        },
        {
          id: createId("essay"),
          title: "프로젝트 또는 협업 경험",
          guide: DEFAULT_ESSAYS[2].guide,
          content:
            "수집형 RPG 프로젝트에서 시스템 기획을 맡아 개발 역할의 팀원과 매주 구현 범위를 조율했습니다. 규칙 설명만 전달하지 않고 화면 예시와 예외 상황을 함께 작성했으며, 구현이 어려운 기능은 핵심 경험을 유지하는 범위에서 단순화했습니다. 그 결과 정해진 기간 안에 주요 성장 흐름을 시연할 수 있었습니다.",
        },
        {
          id: createId("essay"),
          title: "문제 해결 경험",
          guide: DEFAULT_ESSAYS[3].guide,
          content:
            "초기 테스트에서 강화 재화가 빠르게 부족해 플레이가 중단되는 문제가 있었습니다. 구간별 획득량과 소비량을 비교해 초반 보상 간격이 긴 것을 원인으로 판단했습니다. 초반 임무 보상을 조정하고 강화 비용 증가 폭을 완화한 뒤 다시 테스트했고, 목표 구간까지 자연스럽게 진행되는 것을 확인했습니다.",
        },
        {
          id: createId("essay"),
          title: "입사 후 목표",
          guide: DEFAULT_ESSAYS[4].guide,
          content:
            "입사 후에는 라이브 게임의 지표와 사용자 반응을 함께 확인하며 시스템을 개선할 수 있는 기획자로 성장하고 싶습니다. 먼저 팀의 문서 형식과 개발 프로세스를 정확히 익히고, 작은 기능이라도 의도와 예외 조건이 명확한 기획서를 작성하겠습니다.",
        },
      ],
    };
  }

  function init() {
    state = loadState();
    renderRepeaters();
    syncFormFromState();
    renderPreview();
    renderEssayCounts();
    updatePresetNote();
    bindEvents();
    setSaveStatus("자동 저장됐어요", "saved");
  }

  function bindEvents() {
    dom.form.addEventListener("input", handleFormChange);
    dom.form.addEventListener("change", handleFormChange);
    dom.form.addEventListener("click", handleFormClick);
    dom.photoInput.addEventListener("change", handlePhotoUpload);

    dom.refreshButton.addEventListener("click", () => {
      renderPreview();
      announcePreviewRefresh();
    });

    dom.resetButton.addEventListener("click", resetAllData);
    dom.sampleButton.addEventListener("click", loadSampleData);
    dom.printButton.addEventListener("click", () => window.print());
    dom.openGuideButton.addEventListener("click", openGuide);
    dom.closeGuideButton.addEventListener("click", closeGuide);
    dom.guideDialog.addEventListener("click", handleGuideBackdropClick);

    window.addEventListener("beforeunload", saveStateNow);
    window.addEventListener("resize", schedulePreviewPagination);
  }

  function handleFormChange(event) {
    const target = event.target;

    if (target.matches("[data-project-image]")) {
      handleProjectImageUpload(target);
      return;
    }

    if (target.matches("[data-field]")) {
      setPath(state.student, target.dataset.field, target.value);
    } else if (target.matches("[data-template-field]")) {
      state.template[target.dataset.templateField] = target.value;
      updatePresetNote();
    } else if (target.matches("[data-template-visibility]")) {
      state.template.visibility[target.dataset.templateVisibility] = target.checked;
      renderSectionOrderControls();
    } else if (target.matches("[data-item-field]")) {
      updateRepeatItem(target);
    } else {
      return;
    }

    renderPreview();
    renderEssayCounts();
    scheduleSave();
  }

  function handleFormClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;

    if (action === "add-education") {
      state.student.education.push(createEmptyEducation());
      renderRepeaters();
      focusLatestItem(dom.educationItems);
    }

    if (action === "add-work-experience") {
      state.student.workExperiences.push(createEmptyWorkExperience());
      renderRepeaters();
      focusLatestItem(dom.workExperienceItems);
    }

    if (action === "add-project") {
      state.student.projects.push(createEmptyProject());
      renderRepeaters();
      focusLatestItem(dom.projectItems);
    }

    if (action === "add-award") {
      state.student.awards.push(createEmptyAward());
      renderRepeaters();
      focusLatestItem(dom.awardItems);
    }

    if (action === "add-activity") {
      state.student.activities.push(createEmptyActivity());
      renderRepeaters();
      focusLatestItem(dom.activityItems);
    }

    if (action === "add-certification") {
      state.student.certifications.push(createEmptyCertification());
      renderRepeaters();
      focusLatestItem(dom.certificationItems);
    }

    if (action === "add-skill") {
      state.student.skills.push(createEmptySkill());
      renderRepeaters();
      focusLatestItem(dom.skillItems);
    }

    if (action === "add-essay") {
      addEssayItem();
    }

    if (action === "remove-education") {
      removeRepeatItem("education", button.dataset.itemId);
    }

    if (action === "remove-work-experience") {
      removeRepeatItem("workExperiences", button.dataset.itemId);
    }

    if (action === "remove-project") {
      removeRepeatItem("projects", button.dataset.itemId);
    }

    if (action === "remove-project-image") {
      const project = state.student.projects.find(
        (item) => item.id === button.dataset.itemId,
      );
      if (project) {
        project.image = "";
        renderProjectImageInputPreview(project.id);
        setProjectImageStatus(project.id, "프로젝트 이미지가 삭제됐어요.");
      }
    }

    if (action === "remove-award") {
      removeRepeatItem("awards", button.dataset.itemId);
    }

    if (action === "remove-activity") {
      removeRepeatItem("activities", button.dataset.itemId);
    }

    if (action === "remove-certification") {
      removeRepeatItem("certifications", button.dataset.itemId);
    }

    if (action === "remove-skill") {
      removeRepeatItem("skills", button.dataset.itemId);
    }

    if (action === "remove-essay") {
      removeRepeatItem("essays", button.dataset.itemId);
    }

    if (action === "remove-photo") {
      state.student.basic.photo = "";
      dom.photoInput.value = "";
      renderPhotoInputPreview();
      setPhotoStatus("사진을 삭제했어요.");
    }

    if (action === "move-section-up") {
      moveTemplateSection(button.dataset.sectionKey, -1);
    }

    if (action === "move-section-down") {
      moveTemplateSection(button.dataset.sectionKey, 1);
    }

    renderPreview();
    scheduleSave();
  }

  async function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      setPhotoStatus("JPG, PNG, WEBP 이미지 파일을 선택해 주세요.", true);
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      event.target.value = "";
      setPhotoStatus("사진은 8MB 이하 파일로 선택해 주세요.", true);
      return;
    }

    setPhotoStatus("사진을 문서 크기에 맞게 정리하고 있어요.");

    try {
      const source = await readFileAsDataUrl(file);
      state.student.basic.photo = await resizePhoto(source);
      renderPhotoInputPreview();
      renderPreview();
      scheduleSave();
      setPhotoStatus("사진을 저장했어요.");
    } catch (error) {
      console.warn("사진을 처리하지 못했습니다.", error);
      event.target.value = "";
      setPhotoStatus("사진을 불러오지 못했어요. 다른 파일을 선택해 주세요.", true);
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("파일 읽기 실패"));
      reader.readAsDataURL(file);
    });
  }

  function resizePhoto(source) {
    return resizeImageToRatio(source, 360, 480, 0.84);
  }

  function resizeProjectImage(source) {
    return resizeImageToRatio(source, 640, 360, 0.8);
  }

  function resizeImageToRatio(source, outputWidth, outputHeight, quality) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("이미지 처리 기능을 사용할 수 없습니다."));
          return;
        }

        const targetRatio = outputWidth / outputHeight;
        const sourceRatio = image.naturalWidth / image.naturalHeight;
        let sourceWidth = image.naturalWidth;
        let sourceHeight = image.naturalHeight;
        let sourceX = 0;
        let sourceY = 0;

        if (sourceRatio > targetRatio) {
          sourceWidth = image.naturalHeight * targetRatio;
          sourceX = (image.naturalWidth - sourceWidth) / 2;
        } else {
          sourceHeight = image.naturalWidth / targetRatio;
          sourceY = (image.naturalHeight - sourceHeight) / 2;
        }

        canvas.width = outputWidth;
        canvas.height = outputHeight;
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, outputWidth, outputHeight);
        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          outputWidth,
          outputHeight,
        );

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      image.onerror = () => reject(new Error("이미지 디코딩 실패"));
      image.src = source;
    });
  }

  async function handleProjectImageUpload(input) {
    const project = state.student.projects.find(
      (item) => item.id === input.dataset.itemId,
    );
    const file = input.files?.[0];
    if (!project || !file) return;

    if (!file.type.startsWith("image/")) {
      input.value = "";
      setProjectImageStatus(
        project.id,
        "JPG, PNG, WEBP 이미지 파일을 선택해 주세요.",
        true,
      );
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      input.value = "";
      setProjectImageStatus(
        project.id,
        "이미지는 8MB 이하 파일로 선택해 주세요.",
        true,
      );
      return;
    }

    setProjectImageStatus(project.id, "썸네일을 16:9 비율로 정리하고 있어요.");

    try {
      const source = await readFileAsDataUrl(file);
      project.image = await resizeProjectImage(source);
      renderProjectImageInputPreview(project.id);
      renderPreview();
      scheduleSave();
      setProjectImageStatus(project.id, "프로젝트 이미지를 저장했어요.");
    } catch (error) {
      console.warn("프로젝트 이미지를 처리하지 못했습니다.", error);
      input.value = "";
      setProjectImageStatus(
        project.id,
        "이미지를 불러오지 못했어요. 다른 파일을 선택해 주세요.",
        true,
      );
    }
  }

  function renderPhotoInputPreview() {
    const photo = clean(state.student.basic.photo);
    const removeButton = document.querySelector("#remove-photo");
    dom.photoInputPreview.replaceChildren();

    if (photo) {
      const image = document.createElement("img");
      image.src = photo;
      image.alt = "업로드한 증명사진 미리보기";
      dom.photoInputPreview.append(image);
    } else {
      const emptyText = document.createElement("span");
      emptyText.textContent = "사진 없음";
      dom.photoInputPreview.append(emptyText);
    }

    if (removeButton) removeButton.disabled = !photo;
  }

  function setPhotoStatus(message, isError = false) {
    dom.photoStatus.textContent = message;
    dom.photoStatus.dataset.state = isError ? "error" : "normal";
  }

  function renderProjectImageInputPreview(itemId) {
    const project = state.student.projects.find((item) => item.id === itemId);
    const preview = dom.projectItems.querySelector(
      `[data-project-image-preview="${itemId}"]`,
    );
    const removeButton = dom.projectItems.querySelector(
      `[data-action="remove-project-image"][data-item-id="${itemId}"]`,
    );
    const uploadLabel = dom.projectItems.querySelector(
      `[data-project-image-label="${itemId}"]`,
    );
    if (!project || !preview) return;

    const imageSource = sanitizeProjectImage(project.image);
    preview.replaceChildren();

    if (imageSource) {
      const image = document.createElement("img");
      image.src = imageSource;
      image.alt = "업로드한 프로젝트 썸네일 미리보기";
      preview.append(image);
    } else {
      const emptyText = document.createElement("span");
      emptyText.textContent = "이미지 없음";
      preview.append(emptyText);
    }

    if (removeButton) removeButton.disabled = !imageSource;
    if (uploadLabel) {
      uploadLabel.textContent = imageSource ? "이미지 변경" : "이미지 선택";
    }
  }

  function setProjectImageStatus(itemId, message, isError = false) {
    const status = dom.projectItems.querySelector(
      `[data-project-image-status="${itemId}"]`,
    );
    if (!status) return;
    status.textContent = message;
    status.dataset.state = isError ? "error" : "normal";
  }

  function focusLatestItem(container) {
    requestAnimationFrame(() => {
      const items = container.querySelectorAll(".repeat-item");
      const lastInput = items[items.length - 1]?.querySelector("input, textarea");
      lastInput?.focus();
    });
  }

  function updateRepeatItem(target) {
    const type = target.dataset.repeatType;
    const itemId = target.dataset.itemId;
    const field = target.dataset.itemField;
    const list = state.student[type];
    const item = Array.isArray(list) ? list.find((entry) => entry.id === itemId) : null;

    if (!item) return;

    if (field.startsWith("contributions.")) {
      const index = Number(field.split(".")[1]);
      if (Number.isInteger(index) && index >= 0 && index < 3) {
        item.contributions[index] = target.value;
      }
      return;
    }

    item[field] = target.value;
    if (type === "essays" && field === "content") {
      const counter = dom.form.querySelector(
        `[data-essay-count="${itemId}"]`,
      );
      if (counter) {
        counter.textContent = `${target.value.length.toLocaleString("ko-KR")}자`;
      }
    }
  }

  function removeRepeatItem(type, itemId) {
    const list = state.student[type];
    if (!Array.isArray(list)) return;

    state.student[type] = list.filter((item) => item.id !== itemId);

    if (state.student[type].length === 0) {
      state.student[type].push(createEmptyItemForType(type));
    }

    renderRepeaters();
  }

  function createEmptyItemForType(type) {
    const factories = {
      education: createEmptyEducation,
      workExperiences: createEmptyWorkExperience,
      projects: createEmptyProject,
      awards: createEmptyAward,
      activities: createEmptyActivity,
      certifications: createEmptyCertification,
      skills: createEmptySkill,
      essays: createEmptyEssay,
    };

    return factories[type]?.() || { id: createId(type) };
  }

  function renderRepeaters() {
    renderEducationInputs();
    renderWorkExperienceInputs();
    renderProjectInputs();
    renderAwardInputs();
    renderActivityInputs();
    renderCertificationInputs();
    renderSkillInputs();
    renderEssayInputs();
  }

  function renderEducationInputs() {
    dom.educationItems.replaceChildren(
      ...state.student.education.map((item, index) =>
        createEducationInputItem(item, index),
      ),
    );
  }

  function renderProjectInputs() {
    dom.projectItems.replaceChildren(
      ...state.student.projects.map((item, index) =>
        createProjectInputItem(item, index),
      ),
    );
  }

  function renderWorkExperienceInputs() {
    dom.workExperienceItems.replaceChildren(
      ...state.student.workExperiences.map((item, index) =>
        createWorkExperienceInputItem(item, index),
      ),
    );
  }

  function renderAwardInputs() {
    dom.awardItems.replaceChildren(
      ...state.student.awards.map((item, index) =>
        createAwardInputItem(item, index),
      ),
    );
  }

  function renderActivityInputs() {
    dom.activityItems.replaceChildren(
      ...state.student.activities.map((item, index) =>
        createActivityInputItem(item, index),
      ),
    );
  }

  function renderCertificationInputs() {
    dom.certificationItems.replaceChildren(
      ...state.student.certifications.map((item, index) =>
        createCertificationInputItem(item, index),
      ),
    );
  }

  function renderSkillInputs() {
    dom.skillItems.replaceChildren(
      ...state.student.skills.map((item, index) =>
        createSkillInputItem(item, index),
      ),
    );
  }

  function renderEssayInputs() {
    dom.essayItems.replaceChildren(
      ...state.student.essays.map((item, index) =>
        createEssayInputItem(item, index),
      ),
    );
  }

  function createEducationInputItem(item, index) {
    const wrapper = createElement("article", "repeat-item");
    wrapper.dataset.itemId = item.id;

    const header = createRepeatHeader(
      `교육 이력 ${index + 1}`,
      "remove-education",
      item.id,
    );
    const grid = createElement("div", "field-grid two-columns");

    grid.append(
      createRepeatField("기관명", item, "education", "institution", "예: 교육기관명"),
      createRepeatField(
        "과정명 또는 전공명",
        item,
        "education",
        "course",
        "예: 게임 기획 실무 과정",
      ),
      createRepeatField(
        "기간",
        item,
        "education",
        "period",
        "예: 2025.09 - 2026.03",
      ),
      createRepeatField(
        "학점 (선택)",
        item,
        "education",
        "grade",
        "예: 3.8 / 4.5",
      ),
      createRepeatField("비고", item, "education", "note", "예: 수료 / 재학"),
      createRepeatField(
        "주요 학습 내용",
        item,
        "education",
        "learning",
        "핵심 학습 내용을 간단히 입력하세요.",
        true,
        true,
      ),
    );

    wrapper.append(header, grid);
    return wrapper;
  }

  function createWorkExperienceInputItem(item, index) {
    const wrapper = createElement("article", "repeat-item");
    wrapper.dataset.itemId = item.id;
    const header = createRepeatHeader(
      `실무 경험 ${index + 1}`,
      "remove-work-experience",
      item.id,
    );
    const grid = createElement("div", "field-grid two-columns");

    grid.append(
      createRepeatField(
        "회사 / 기관 / 매장명",
        item,
        "workExperiences",
        "organization",
        "예: 게임사, 기관, 아르바이트 매장",
      ),
      createRepeatSelectField(
        "경험 유형",
        item,
        "workExperiences",
        "type",
        ["", "인턴", "현장실습", "계약 / 프리랜서", "아르바이트", "기타 실무 경험"],
      ),
      createRepeatField(
        "기간",
        item,
        "workExperiences",
        "period",
        "예: 2025.01 - 2025.06",
      ),
      createRepeatField(
        "직무 / 역할",
        item,
        "workExperiences",
        "role",
        "예: 기획 인턴, 매장 운영",
      ),
      createRepeatField(
        "수행 업무",
        item,
        "workExperiences",
        "details",
        "실제로 맡은 업무와 책임을 작성하세요.",
        true,
        true,
      ),
      createRepeatField(
        "성과 / 배운 점 (선택)",
        item,
        "workExperiences",
        "achievements",
        "개선한 점, 결과, 직무에 활용 가능한 경험을 작성하세요.",
        true,
        true,
      ),
    );

    wrapper.append(header, grid);
    return wrapper;
  }

  function createProjectInputItem(item, index) {
    const wrapper = createElement("article", "repeat-item");
    wrapper.dataset.itemId = item.id;

    const header = createRepeatHeader(
      `프로젝트 ${index + 1}`,
      "remove-project",
      item.id,
    );
    const grid = createElement("div", "field-grid two-columns");

    const releaseLinkField = createRepeatField(
      "출시 / 시연 링크 (선택)",
      item,
      "projects",
      "releaseLink",
      "예: https://store.example.com/my-game",
    );
    releaseLinkField.querySelector("input").type = "url";

    grid.append(
      createRepeatField("프로젝트명", item, "projects", "name", "프로젝트명"),
      createRepeatField(
        "기간",
        item,
        "projects",
        "period",
        "예: 2026.01 - 2026.03",
      ),
      createRepeatField("역할", item, "projects", "role", "예: 시스템 기획"),
      createRepeatField(
        "사용 툴 / 기술",
        item,
        "projects",
        "tools",
        "예: Excel, Figma, Notion",
      ),
      createRepeatField(
        "프로젝트 한 줄 설명",
        item,
        "projects",
        "summary",
        "목적과 결과가 드러나는 한 문장",
        true,
        true,
      ),
      releaseLinkField,
      createProjectImageField(item),
    );

    const contributionGroup = createElement("div", "contribution-grid field-span");
    item.contributions.forEach((value, contributionIndex) => {
      contributionGroup.append(
        createRepeatField(
          `주요 기여 ${contributionIndex + 1}`,
          item,
          "projects",
          `contributions.${contributionIndex}`,
          "본인이 실제로 수행한 일을 입력하세요.",
          true,
        ),
      );
    });

    grid.append(
      contributionGroup,
      createRepeatField(
        "회고 (선택)",
        item,
        "projects",
        "retrospective",
        "잘된 점, 아쉬웠던 점, 다음에 개선할 점을 짧게 정리해 보세요.",
        true,
        true,
      ),
    );
    wrapper.append(header, grid);
    return wrapper;
  }

  function createProjectImageField(item) {
    const wrapper = createElement("div", "field field-span project-image-field");
    const uploadId = `project-image-${item.id}`;
    const preview = createElement("div", "project-image-input-preview");
    const copy = createElement("div", "project-image-upload-copy");
    const title = document.createElement("strong");
    const description = document.createElement("p");
    const actions = createElement("div", "photo-actions");
    const uploadLabel = createElement(
      "label",
      "button button-secondary photo-upload-button",
    );
    const input = document.createElement("input");
    const removeButton = createElement("button", "button button-delete");
    const status = createElement("p", "field-help project-image-status");
    const imageSource = sanitizeProjectImage(item.image);

    preview.dataset.projectImagePreview = item.id;
    if (imageSource) {
      const image = document.createElement("img");
      image.src = imageSource;
      image.alt = "업로드한 프로젝트 썸네일 미리보기";
      preview.append(image);
    } else {
      const emptyText = document.createElement("span");
      emptyText.textContent = "이미지 없음";
      preview.append(emptyText);
    }

    title.textContent = "프로젝트 썸네일 (선택)";
    description.textContent =
      "대표 화면, 게임 플레이, 기획서 표지처럼 프로젝트를 빠르게 이해할 수 있는 이미지를 넣어 보세요.";

    uploadLabel.htmlFor = uploadId;
    uploadLabel.textContent = imageSource ? "이미지 변경" : "이미지 선택";
    uploadLabel.dataset.projectImageLabel = item.id;

    input.id = uploadId;
    input.className = "visually-hidden";
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.dataset.projectImage = "";
    input.dataset.itemId = item.id;

    removeButton.type = "button";
    removeButton.dataset.action = "remove-project-image";
    removeButton.dataset.itemId = item.id;
    removeButton.textContent = "이미지 삭제";
    removeButton.disabled = !imageSource;

    status.dataset.projectImageStatus = item.id;
    status.textContent =
      "JPG, PNG, WEBP / 8MB 이하 권장 · 문서에서는 16:9 비율로 표시돼요.";

    actions.append(uploadLabel, input, removeButton);
    copy.append(title, description, actions, status);
    wrapper.append(preview, copy);
    return wrapper;
  }

  function createAwardInputItem(item, index) {
    const wrapper = createElement("article", "repeat-item");
    wrapper.dataset.itemId = item.id;
    const header = createRepeatHeader(
      `수상 / 공모전 ${index + 1}`,
      "remove-award",
      item.id,
    );
    const grid = createElement("div", "field-grid two-columns");

    grid.append(
      createRepeatField("공모전 / 대회명", item, "awards", "name", "행사명"),
      createRepeatField("주최 기관", item, "awards", "organizer", "주최 / 주관"),
      createRepeatField("기간 / 일자", item, "awards", "period", "예: 2025.08"),
      createRepeatField(
        "결과 / 구분",
        item,
        "awards",
        "result",
        "예: 우수상, 본선 진출, 참가",
      ),
      createRepeatField(
        "역할 (선택)",
        item,
        "awards",
        "role",
        "예: 시스템 기획 / 3인 팀",
      ),
      createRepeatField(
        "출품 내용 / 주요 활동",
        item,
        "awards",
        "details",
        "무엇을 제안하거나 수행했는지 작성하세요.",
        true,
        true,
      ),
    );

    wrapper.append(header, grid);
    return wrapper;
  }

  function createActivityInputItem(item, index) {
    const wrapper = createElement("article", "repeat-item");
    wrapper.dataset.itemId = item.id;
    const header = createRepeatHeader(
      `대외활동 / 기타 경험 ${index + 1}`,
      "remove-activity",
      item.id,
    );
    const grid = createElement("div", "field-grid two-columns");

    grid.append(
      createRepeatField("활동명", item, "activities", "name", "활동 또는 경험명"),
      createRepeatField(
        "기관 / 단체명",
        item,
        "activities",
        "organization",
        "주관 기관 또는 소속",
      ),
      createRepeatSelectField(
        "활동 유형",
        item,
        "activities",
        "type",
        ["", "대외활동", "동아리", "봉사활동", "서포터즈", "공모전 참가", "행사 운영", "기타 경험"],
      ),
      createRepeatField(
        "기간",
        item,
        "activities",
        "period",
        "예: 2024.03 - 2024.12",
      ),
      createRepeatField(
        "역할 (선택)",
        item,
        "activities",
        "role",
        "예: 팀원, 운영 담당, 발표",
      ),
      createRepeatField(
        "주요 활동 / 배운 점",
        item,
        "activities",
        "details",
        "직무와 연결할 수 있는 행동과 경험을 중심으로 작성하세요.",
        true,
        true,
      ),
    );

    wrapper.append(header, grid);
    return wrapper;
  }

  function createCertificationInputItem(item, index) {
    const wrapper = createElement("article", "repeat-item");
    wrapper.dataset.itemId = item.id;
    const header = createRepeatHeader(
      `자격 / 수료 ${index + 1}`,
      "remove-certification",
      item.id,
    );
    const grid = createElement("div", "field-grid two-columns");

    grid.append(
      createRepeatField(
        "자격증 / 시험 / 과정명",
        item,
        "certifications",
        "name",
        "예: 컴퓨터활용능력 2급",
      ),
      createRepeatField(
        "발급 / 주관 기관",
        item,
        "certifications",
        "issuer",
        "예: 대한상공회의소",
      ),
      createRepeatField(
        "취득 / 수료 일자",
        item,
        "certifications",
        "date",
        "예: 2025.06",
      ),
      createRepeatField(
        "등급 / 점수 / 상태 (선택)",
        item,
        "certifications",
        "credential",
        "예: 취득, 850점, 수료",
      ),
      createRepeatField(
        "비고 (선택)",
        item,
        "certifications",
        "details",
        "직무 관련 학습 내용이나 유효기간 등을 입력하세요.",
        true,
        true,
      ),
    );

    wrapper.append(header, grid);
    return wrapper;
  }

  function createSkillInputItem(item, index) {
    const wrapper = createElement("article", "repeat-item skill-input-item");
    wrapper.dataset.itemId = item.id;
    const header = createRepeatHeader(
      `보유 역량 ${index + 1}`,
      "remove-skill",
      item.id,
    );
    const grid = createElement("div", "field-grid two-columns");

    grid.append(
      createRepeatField(
        "역량 / 도구명",
        item,
        "skills",
        "name",
        "예: Figma, 시스템 기획, Excel",
      ),
      createRepeatField(
        "활용 수준",
        item,
        "skills",
        "level",
        "예: UI/UX 와이어프레임 설계 가능",
      ),
    );

    wrapper.append(header, grid);
    return wrapper;
  }

  function createEssayInputItem(item, index) {
    const wrapper = createElement("article", "repeat-item essay-input-item");
    wrapper.dataset.itemId = item.id;
    const header = createRepeatHeader(
      `자기소개서 문항 ${index + 1}`,
      "remove-essay",
      item.id,
    );
    const grid = createElement("div", "field-grid");
    const titleField = createRepeatField(
      "문항 제목",
      item,
      "essays",
      "title",
      "예: 지원 동기",
    );
    const contentField = createRepeatField(
      "작성 내용",
      item,
      "essays",
      "content",
      "이 문항에 맞는 내용을 작성하세요.",
      false,
      true,
    );
    const textarea = contentField.querySelector("textarea");
    const counter = createElement("span", "character-count essay-character-count");

    textarea.rows = 7;
    counter.dataset.essayCount = item.id;
    counter.textContent = `${item.content.length.toLocaleString("ko-KR")}자`;
    contentField.querySelector("label").after(counter);

    grid.append(titleField, contentField);

    if (clean(item.guide)) {
      const guide = createElement("p", "field-help essay-guide");
      guide.textContent = item.guide;
      grid.append(guide);
    }

    wrapper.append(header, grid);
    return wrapper;
  }

  function addEssayItem() {
    const presetTitle = clean(dom.essayPreset.value);
    const customTitle = clean(dom.customEssayTitle.value);
    const title = customTitle || presetTitle;

    if (!title) {
      dom.customEssayTitle.focus();
      dom.customEssayTitle.setAttribute(
        "placeholder",
        "추가할 문항 제목을 먼저 입력해 주세요.",
      );
      return;
    }

    const preset = DEFAULT_ESSAYS.find((essay) => essay.title === title);
    state.student.essays.push(createEmptyEssay(title, preset?.guide || ""));
    dom.essayPreset.value = "";
    dom.customEssayTitle.value = "";
    renderRepeaters();
    focusLatestItem(dom.essayItems);
  }

  function openGuide() {
    if (typeof dom.guideDialog.showModal === "function") {
      dom.guideDialog.showModal();
      return;
    }
    dom.guideDialog.setAttribute("open", "");
  }

  function closeGuide() {
    if (typeof dom.guideDialog.close === "function") {
      dom.guideDialog.close();
      return;
    }
    dom.guideDialog.removeAttribute("open");
  }

  function handleGuideBackdropClick(event) {
    if (event.target === dom.guideDialog) closeGuide();
  }

  function createRepeatHeader(title, action, itemId) {
    const header = createElement("div", "repeat-item-header");
    const heading = createElement("h3");
    heading.textContent = title;

    const button = createElement("button", "button button-delete");
    button.type = "button";
    button.dataset.action = action;
    button.dataset.itemId = itemId;
    button.textContent = "삭제";
    button.setAttribute("aria-label", `${title} 삭제`);

    header.append(heading, button);
    return header;
  }

  function createRepeatField(
    labelText,
    item,
    type,
    field,
    placeholder,
    span = false,
    multiline = false,
  ) {
    const wrapper = createElement("div", span ? "field field-span" : "field");
    const inputId = `${type}-${item.id}-${field.replace(".", "-")}`;
    const label = createElement("label");
    label.htmlFor = inputId;
    label.textContent = labelText;

    const input = multiline
      ? document.createElement("textarea")
      : document.createElement("input");

    if (multiline) input.rows = 3;
    if (!multiline) input.type = "text";

    input.id = inputId;
    input.value = field.startsWith("contributions.")
      ? item.contributions[Number(field.split(".")[1])] || ""
      : item[field] || "";
    input.placeholder = placeholder;
    input.dataset.repeatType = type;
    input.dataset.itemId = item.id;
    input.dataset.itemField = field;

    wrapper.append(label, input);
    return wrapper;
  }

  function createRepeatSelectField(labelText, item, type, field, options) {
    const wrapper = createElement("div", "field");
    const inputId = `${type}-${item.id}-${field}`;
    const label = createElement("label");
    const select = document.createElement("select");

    label.htmlFor = inputId;
    label.textContent = labelText;
    select.id = inputId;
    select.dataset.repeatType = type;
    select.dataset.itemId = item.id;
    select.dataset.itemField = field;

    options.forEach((optionValue, index) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = index === 0 ? "선택하지 않음" : optionValue;
      select.append(option);
    });

    if (item[field] && !options.includes(item[field])) {
      const customOption = document.createElement("option");
      customOption.value = item[field];
      customOption.textContent = item[field];
      select.append(customOption);
    }

    select.value = item[field] || "";
    wrapper.append(label, select);
    return wrapper;
  }

  function syncFormFromState() {
    dom.form.querySelectorAll("[data-field]").forEach((input) => {
      input.value = getPath(state.student, input.dataset.field) || "";
    });

    dom.form.querySelectorAll("[data-template-field]").forEach((input) => {
      input.value = state.template[input.dataset.templateField] || "";
    });

    dom.form
      .querySelectorAll("[data-template-visibility]")
      .forEach((checkbox) => {
        checkbox.checked = Boolean(
          state.template.visibility[checkbox.dataset.templateVisibility],
        );
      });

    renderPhotoInputPreview();
    renderSectionOrderControls();
  }

  function renderSectionOrderControls() {
    if (!dom.sectionOrderList) return;

    const order = state.template.sectionOrder;
    dom.sectionOrderList.replaceChildren(
      ...order.map((key, index) => {
        const definition = SECTION_DEFINITIONS.find((section) => section.key === key);
        const item = createElement("li", "section-order-item");
        const label = createElement("span", "section-order-label");
        const position = createElement("span", "section-order-position");
        const actions = createElement("span", "section-order-actions");
        const upButton = createElement("button", "section-order-button");
        const downButton = createElement("button", "section-order-button");
        const isVisible = state.template.visibility[key];

        position.textContent = String(index + 1).padStart(2, "0");
        label.textContent = definition?.label || key;
        if (!isVisible) {
          item.classList.add("is-hidden-section");
          const hiddenLabel = createElement("small", "section-order-hidden");
          hiddenLabel.textContent = "문서에서 숨김";
          label.append(hiddenLabel);
        }

        upButton.type = "button";
        upButton.dataset.action = "move-section-up";
        upButton.dataset.sectionKey = key;
        upButton.textContent = "↑";
        upButton.disabled = index === 0;
        upButton.setAttribute("aria-label", `${label.firstChild.textContent} 위로 이동`);

        downButton.type = "button";
        downButton.dataset.action = "move-section-down";
        downButton.dataset.sectionKey = key;
        downButton.textContent = "↓";
        downButton.disabled = index === order.length - 1;
        downButton.setAttribute("aria-label", `${label.firstChild.textContent} 아래로 이동`);

        actions.append(upButton, downButton);
        item.append(position, label, actions);
        return item;
      }),
    );
  }

  function moveTemplateSection(sectionKey, direction) {
    const order = state.template.sectionOrder;
    const currentIndex = order.indexOf(sectionKey);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= order.length) return;

    [order[currentIndex], order[nextIndex]] = [order[nextIndex], order[currentIndex]];
    renderSectionOrderControls();
  }

  function documentTemplateClasses() {
    return [
      `layout-${state.template.layout}`,
      `font-${state.template.fontSize}`,
      `manual-margin-${state.template.pageMargin}`,
      `manual-spacing-${state.template.sectionSpacing}`,
      `manual-heading-${state.template.headingStyle}`,
      `manual-title-${state.template.titleAlign}`,
    ].join(" ");
  }

  function renderPreview() {
    const preview = dom.preview;
    preview.className = `preview-pages ${documentTemplateClasses()}`;
    preview.style.zoom = "1";
    preview.replaceChildren();

    const flowNodes = [createDocumentTopline()];

    let visibleContentCount = 0;
    let sectionNumber = 1;
    const nextSectionNumber = () => String(sectionNumber++).padStart(2, "0");

    const education = nonEmptyEducation();
    const workExperiences = nonEmptyItems("workExperiences", [
      "organization",
      "type",
      "period",
      "role",
      "details",
      "achievements",
    ]);
    const projects = nonEmptyProjects();
    const awards = nonEmptyItems("awards", [
      "name",
      "organizer",
      "period",
      "result",
      "role",
      "details",
    ]);
    const activities = nonEmptyItems("activities", [
      "name",
      "organization",
      "type",
      "period",
      "role",
      "details",
    ]);
    const certifications = nonEmptyItems("certifications", [
      "name",
      "issuer",
      "date",
      "credential",
      "details",
    ]);
    const skills = nonEmptySkills();
    const essays = nonEmptyEssays();

    const sections = {
      basic: {
        hasContent: hasBasicContent(),
        create: () => createIdentityBlock(),
      },
      education: {
        hasContent: education.length > 0,
        create: () => createEducationSection(education, nextSectionNumber()),
      },
      workExperiences: {
        hasContent: workExperiences.length > 0,
        create: () =>
          createWorkExperienceSection(workExperiences, nextSectionNumber()),
      },
      projects: {
        hasContent: projects.length > 0,
        create: () => createProjectSection(projects, nextSectionNumber()),
      },
      awards: {
        hasContent: awards.length > 0,
        create: () => createAwardSection(awards, nextSectionNumber()),
      },
      activities: {
        hasContent: activities.length > 0,
        create: () => createActivitySection(activities, nextSectionNumber()),
      },
      certifications: {
        hasContent: certifications.length > 0,
        create: () =>
          createCertificationSection(certifications, nextSectionNumber()),
      },
      skills: {
        hasContent: skills.length > 0,
        create: () => createSkillsSection(skills, nextSectionNumber()),
      },
      essays: {
        hasContent: essays.length > 0,
        create: () => createEssaySection(essays, nextSectionNumber()),
      },
    };

    state.template.sectionOrder.forEach((key) => {
      const section = sections[key];
      if (!section || !state.template.visibility[key] || !section.hasContent) return;
      flowNodes.push(section.create());
      visibleContentCount += 1;
    });

    if (visibleContentCount === 0) {
      flowNodes.push(createEmptyDocumentMessage());
    }

    paginateDocument(flowNodes);
    updateCompletionProgress();
  }

  function schedulePreviewPagination() {
    window.cancelAnimationFrame(paginationFrame);
    paginationFrame = window.requestAnimationFrame(renderPreview);
  }

  function paginateDocument(flowNodes) {
    const context = {
      pages: [],
      current: null,
    };

    context.current = createDocumentPage(context, 1);

    flowNodes.forEach((node) => {
      if (node.classList?.contains("document-section")) {
        paginateSection(context, node);
      } else {
        appendAtomicNode(context, node);
      }
    });

    updatePageNumbers(context.pages);
  }

  function createDocumentPage(context, pageNumber) {
    const page = createElement(
      "article",
      `document-sheet document-page ${documentTemplateClasses()}`,
    );
    const content = createElement("div", "document-page-content");
    const footer = createElement("footer", "document-page-footer");

    page.dataset.pageNumber = String(pageNumber);

    if (pageNumber > 1) {
      content.append(createRunningHeader());
    }

    page.append(content, footer);
    dom.preview.append(page);

    const pageState = { page, content, footer };
    context.pages.push(pageState);
    return pageState;
  }

  function createRunningHeader() {
    const header = createElement("header", "document-running-header");
    const title = document.createElement("span");
    const name = document.createElement("span");

    title.textContent = clean(state.template.title) || "이력서 및 자기소개서";
    name.textContent = clean(state.student.basic.name);
    header.append(title);
    if (name.textContent) header.append(name);
    return header;
  }

  function appendAtomicNode(context, node) {
    const hadContent = pageHasFlowContent(context.current.content);
    context.current.content.append(node);

    if (pageIsOverflowing(context.current.content) && hadContent) {
      node.remove();
      context.current = createDocumentPage(context, context.pages.length + 1);
      context.current.content.append(node);
    }

    if (pageIsOverflowing(context.current.content)) {
      node.classList.add("oversized-page-block");
    }
  }

  function paginateSection(context, sourceSection) {
    const sourceList = Array.from(sourceSection.children).find(
      (child) => !child.classList.contains("document-section-title"),
    );
    const entries = sourceList ? Array.from(sourceList.children) : [];
    let continuation = false;
    let shell = createAndPlaceSectionShell(
      context,
      sourceSection,
      continuation,
    );

    if (entries.length === 0) return;

    entries.forEach((entry) => {
      shell.list.append(entry);

      if (!pageIsOverflowing(context.current.content)) return;

      entry.remove();
      const sectionHasEntries = shell.list.children.length > 0;

      if (!sectionHasEntries) {
        shell.section.remove();
      }

      context.current = createDocumentPage(context, context.pages.length + 1);
      continuation = continuation || sectionHasEntries;
      shell = createAndPlaceSectionShell(context, sourceSection, continuation);
      shell.list.append(entry);

      if (!pageIsOverflowing(context.current.content)) return;

      entry.remove();
      if (entry.classList.contains("essay-entry")) {
        splitEssayEntryAcrossPages(context, sourceSection, shell, entry);
      } else {
        splitEntryAcrossPages(context, sourceSection, shell, entry);
      }
    });
  }

  function createAndPlaceSectionShell(context, sourceSection, continuation) {
    let shell = createSectionShell(sourceSection, continuation);
    const hadContent = pageHasFlowContent(context.current.content);
    context.current.content.append(shell.section);

    if (pageIsOverflowing(context.current.content) && hadContent) {
      shell.section.remove();
      context.current = createDocumentPage(context, context.pages.length + 1);
      shell = createSectionShell(sourceSection, continuation);
      context.current.content.append(shell.section);
    }

    return shell;
  }

  function createSectionShell(sourceSection, continuation) {
    const section = sourceSection.cloneNode(false);
    const sourceTitle = sourceSection.querySelector(".document-section-title");
    const sourceList = Array.from(sourceSection.children).find(
      (child) => !child.classList.contains("document-section-title"),
    );
    const title = sourceTitle.cloneNode(true);
    const list = sourceList ? sourceList.cloneNode(false) : document.createElement("div");

    if (continuation) {
      const label = title.lastElementChild;
      if (label) label.textContent = `${label.textContent} (계속)`;
      section.classList.add("continued-section");
    }

    section.append(title, list);
    return { section, list };
  }

  function splitEssayEntryAcrossPages(context, sourceSection, shell, entry) {
    const originalAnswer = entry.querySelector(".essay-answer")?.textContent || "";
    let remainingText = originalAnswer.trim();
    let firstChunk = true;

    if (!remainingText) {
      shell.list.append(entry);
      return;
    }

    while (remainingText) {
      const chunk = entry.cloneNode(true);
      const answer = chunk.querySelector(".essay-answer");
      const question = chunk.querySelector(".essay-question");

      if (!firstChunk && question) {
        question.textContent = `${question.textContent} (계속)`;
      }

      shell.list.append(chunk);
      answer.textContent = remainingText;

      if (!pageIsOverflowing(context.current.content)) break;

      const fittingLength = findFittingTextLength(
        context.current.content,
        answer,
        remainingText,
      );

      if (fittingLength < 20) {
        answer.textContent = remainingText;
        chunk.classList.add("oversized-page-block");
        break;
      }

      const breakIndex = findNaturalTextBreak(remainingText, fittingLength);
      answer.textContent = remainingText.slice(0, breakIndex).trim();
      remainingText = remainingText.slice(breakIndex).trim();

      if (remainingText) {
        context.current = createDocumentPage(context, context.pages.length + 1);
        shell = createAndPlaceSectionShell(context, sourceSection, true);
      }

      firstChunk = false;
    }
  }

  function splitEntryAcrossPages(context, sourceSection, shell, entry) {
    const children = Array.from(entry.children);
    const repeatableHeading = children.find((child) =>
      child.matches(".project-heading"),
    );
    let chunk = entry.cloneNode(false);
    let chunkHasContent = false;

    shell.list.append(chunk);

    children.forEach((child, childIndex) => {
      chunk.append(child);

      if (!pageIsOverflowing(context.current.content)) {
        chunkHasContent = true;
        return;
      }

      child.remove();

      if (!chunkHasContent) {
        chunk.append(child);
        chunk.classList.add("oversized-page-block");
        chunkHasContent = true;
        return;
      }

      context.current = createDocumentPage(context, context.pages.length + 1);
      shell = createAndPlaceSectionShell(context, sourceSection, true);
      chunk = entry.cloneNode(false);
      chunk.classList.add("continued-entry");

      if (repeatableHeading && childIndex > 0) {
        const repeatedHeading = repeatableHeading.cloneNode(true);
        repeatedHeading.classList.add("continued-entry-heading");
        chunk.append(repeatedHeading);
      }

      chunk.append(child);
      shell.list.append(chunk);
      chunkHasContent = true;

      if (pageIsOverflowing(context.current.content)) {
        chunk.classList.add("oversized-page-block");
      }
    });
  }

  function findFittingTextLength(content, textElement, text) {
    let low = 1;
    let high = text.length;
    let best = 0;

    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      textElement.textContent = text.slice(0, middle);

      if (pageIsOverflowing(content)) {
        high = middle - 1;
      } else {
        best = middle;
        low = middle + 1;
      }
    }

    return best;
  }

  function findNaturalTextBreak(text, maximumLength) {
    if (maximumLength >= text.length) return text.length;

    const minimumLength = Math.max(1, Math.floor(maximumLength * 0.65));
    const candidates = [
      text.lastIndexOf("\n", maximumLength),
      text.lastIndexOf(". ", maximumLength) + 1,
      text.lastIndexOf("다. ", maximumLength) + 2,
      text.lastIndexOf(" ", maximumLength),
    ].filter((index) => index >= minimumLength);

    return candidates.length ? Math.max(...candidates) : maximumLength;
  }

  function pageHasFlowContent(content) {
    return Array.from(content.children).some(
      (child) => !child.classList.contains("document-running-header"),
    );
  }

  function pageIsOverflowing(content) {
    if (!content.clientHeight) return false;
    const contentTop = content.getBoundingClientRect().top;
    const usedHeight = Array.from(content.children).reduce((maximum, child) => {
      const rect = child.getBoundingClientRect();
      const marginBottom =
        Number.parseFloat(window.getComputedStyle(child).marginBottom) || 0;
      return Math.max(maximum, rect.bottom - contentTop + marginBottom);
    }, 0);

    return usedHeight > content.clientHeight - 16;
  }

  function updatePageNumbers(pages) {
    const totalPages = Math.max(1, pages.length);

    pages.forEach((pageState, index) => {
      pageState.footer.textContent = `${index + 1} / ${totalPages}`;
      pageState.page.setAttribute(
        "aria-label",
        `A4 문서 ${index + 1}쪽, 전체 ${totalPages}쪽`,
      );
    });

    dom.pageCount.textContent = `A4 · ${totalPages}쪽`;
    applyPreviewScale(pages);
  }

  function applyPreviewScale(pages) {
    const firstPage = pages[0]?.page;
    if (!firstPage || !dom.previewScroll?.clientWidth) return;

    const availableWidth = Math.max(320, dom.previewScroll.clientWidth - 14);
    const pageWidth = firstPage.offsetWidth;
    if (!pageWidth) return;

    const scale = Math.min(1, availableWidth / pageWidth);
    dom.preview.style.zoom = String(Math.max(0.55, scale));
  }

  function createDocumentTopline() {
    const header = createElement("header", "document-topline");
    const copy = createElement("div", "document-topline-copy");

    const type = createElement("p", "document-type");
    type.textContent = "JOB APPLICATION DOCUMENT";

    const title = createElement("h1", "document-title");
    title.textContent = clean(state.template.title) || "이력서 및 자기소개서";

    copy.append(type, title);

    const introText = clean(state.template.intro);
    if (introText) {
      const intro = createElement("p", "document-intro");
      intro.textContent = introText;
      copy.append(intro);
    }

    header.append(copy);
    return header;
  }

  function createIdentityBlock() {
    const basic = state.student.basic;
    const section = createElement("section", "identity-block");
    const identity = createElement("div");
    const contacts = createElement("ul", "contact-list");

    const name = clean(basic.name);
    const role = clean(basic.targetRole);
    const summary = clean(basic.summary);
    const photo = sanitizePhoto(basic.photo);

    if (photo) {
      section.classList.add("has-photo");
      const photoFrame = createElement("figure", "document-photo");
      const photoImage = document.createElement("img");
      photoImage.src = photo;
      photoImage.alt = name ? `${name} 증명사진` : "지원자 증명사진";
      photoFrame.append(photoImage);
      section.append(photoFrame);
    }

    if (name) {
      const heading = createElement("h2", "identity-name");
      heading.textContent = name;
      identity.append(heading);
    }

    if (role) {
      const roleText = createElement("p", "identity-role");
      roleText.textContent = role;
      identity.append(roleText);
    }

    if (summary) {
      const summaryText = createElement("p", "identity-summary");
      summaryText.textContent = summary;
      identity.append(summaryText);
    }

    appendContact(contacts, "이메일", basic.email);
    appendContact(contacts, "연락처", basic.phone);
    appendContact(contacts, "생년월일", basic.birthDate);
    appendContact(contacts, "거주 지역", basic.location);
    appendContact(contacts, "지원 시기", basic.availability);
    appendContact(contacts, "링크", basic.link, true);

    section.append(identity);
    if (contacts.children.length > 0) section.append(contacts);
    return section;
  }

  function appendContact(list, labelText, rawValue, isLink = false) {
    const value = clean(rawValue);
    if (!value) return;

    const item = document.createElement("li");
    const label = createElement("span", "contact-label");
    const content = createElement("span", "contact-value");
    label.textContent = labelText;

    if (isLink) {
      const url = normalizeUrl(value);
      if (url) {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = value;
        content.append(anchor);
      } else {
        content.textContent = value;
      }
    } else {
      content.textContent = value;
    }

    item.append(label, content);
    list.append(item);
  }

  function createEducationSection(items, sectionNumber) {
    const section = createDocumentSection(sectionNumber, "학력 / 교육 이력");
    const list = createElement("div", "education-list");

    items.forEach((item) => {
      const entry = createElement("article", "education-entry");
      const body = document.createElement("div");
      const periodText = clean(item.period);

      const institution = clean(item.institution);
      const course = clean(item.course);
      const grade = clean(item.grade);
      const learning = clean(item.learning);
      const note = clean(item.note);

      if (institution) {
        const title = createElement("h3", "entry-title");
        title.textContent = institution;
        body.append(title);
      }

      if (course) {
        const subtitle = createElement("p", "entry-subtitle");
        subtitle.textContent = course;
        body.append(subtitle);
      }

      if (grade) {
        const gradeText = createElement("p", "entry-detail");
        const gradeLabel = document.createElement("strong");
        gradeLabel.textContent = "학점";
        gradeText.append(gradeLabel, document.createTextNode(grade));
        body.append(gradeText);
      }

      if (learning) {
        const description = createElement("p", "entry-description");
        description.textContent = learning;
        body.append(description);
      }

      if (note) {
        const noteText = createElement("p", "entry-note");
        noteText.textContent = note;
        body.append(noteText);
      }

      if (periodText) {
        const period = createElement("div", "entry-period");
        period.textContent = periodText;
        entry.append(period, body);
      } else {
        entry.classList.add("no-period");
        entry.append(body);
      }

      list.append(entry);
    });

    section.append(list);
    return section;
  }

  function createWorkExperienceSection(items, sectionNumber) {
    const section = createDocumentSection(
      sectionNumber,
      "인턴 / 실무 / 아르바이트 경험",
    );
    const list = createElement("div", "resume-entry-list");

    items.forEach((item) => {
      const entry = createElement("article", "resume-entry");
      appendEntryHeading(entry, item.organization, item.period);

      const typeAndRole = [clean(item.type), clean(item.role)]
        .filter(Boolean)
        .join(" · ");
      appendTextElement(entry, "p", "entry-subtitle", typeAndRole);
      appendTextElement(entry, "p", "entry-description", item.details);
      appendLabeledText(entry, "성과 / 배운 점", item.achievements);
      list.append(entry);
    });

    section.append(list);
    return section;
  }

  function createProjectSection(items, sectionNumber) {
    const section = createDocumentSection(sectionNumber, "프로젝트 경험");
    section.classList.add("project-document-section");
    const list = createElement("div", "project-list");

    items.forEach((item) => {
      const entry = createElement("article", "project-entry");
      const heading = createElement("div", "project-heading");
      const projectName = clean(item.name);
      const projectImage = sanitizeProjectImage(item.image);
      const releaseLink = normalizeUrl(item.releaseLink);

      if (projectImage) {
        entry.classList.add("has-thumbnail");
        const figure = createElement("figure", "project-thumbnail");
        const image = document.createElement("img");
        image.src = projectImage;
        image.alt = projectName
          ? `${projectName} 프로젝트 썸네일`
          : "프로젝트 썸네일";

        if (releaseLink) {
          const anchor = createElement("a", "project-thumbnail-link");
          anchor.href = releaseLink;
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
          anchor.setAttribute(
            "aria-label",
            `${projectName || "프로젝트"} 출시 페이지로 이동`,
          );
          anchor.append(image);
          figure.append(anchor);

          const caption = document.createElement("figcaption");
          caption.textContent = "클릭하면 출시 페이지로 이동합니다.";
          figure.append(caption);
        } else {
          figure.append(image);
        }

        entry.append(figure);
      }

      if (projectName) {
        const title = createElement("h3", "entry-title");
        title.textContent = projectName;
        heading.append(title);
      }

      if (clean(item.period)) {
        const period = createElement("span", "entry-period");
        period.textContent = clean(item.period);
        heading.append(period);
      }

      if (heading.children.length > 0) entry.append(heading);

      const role = clean(item.role);
      const summary = clean(item.summary);
      const tools = clean(item.tools);

      if (role) {
        const meta = createElement("p", "project-meta");
        const label = document.createElement("strong");
        label.textContent = "역할";
        meta.append(label, document.createTextNode(role));
        entry.append(meta);
      }

      if (summary) {
        const description = createElement("p", "project-summary");
        const label = document.createElement("strong");
        label.textContent = "설명";
        description.append(label, document.createTextNode(summary));
        entry.append(description);
      }

      const contributions = item.contributions.map(clean).filter(Boolean);
      if (contributions.length > 0) {
        const block = createElement("div", "contribution-block");
        const label = createElement("p", "contribution-label");
        const contributionList = createElement("ul", "contribution-list");
        label.textContent = "주요 기여";

        contributions.forEach((contribution) => {
          const listItem = document.createElement("li");
          listItem.textContent = contribution;
          contributionList.append(listItem);
        });

        block.append(label, contributionList);
        entry.append(block);
      }

      const retrospective = clean(item.retrospective);
      if (retrospective) {
        const reflection = createElement("div", "project-retrospective");
        const label = document.createElement("strong");
        const content = document.createElement("p");
        label.textContent = "회고";
        content.textContent = retrospective;
        reflection.append(label, content);
        entry.append(reflection);
      }

      if (tools) {
        const meta = createElement("p", "project-meta");
        const label = document.createElement("strong");
        label.textContent = "사용 툴";
        meta.append(label, document.createTextNode(tools));
        entry.append(meta);
      }

      if (!projectImage && clean(item.releaseLink)) {
        const launch = createElement("p", "project-launch");
        const label = document.createElement("strong");
        label.textContent = "출시 링크";
        launch.append(label);

        if (releaseLink) {
          const anchor = document.createElement("a");
          anchor.href = releaseLink;
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
          anchor.textContent = "출시 페이지 보기";
          launch.append(anchor);
        } else {
          launch.append(document.createTextNode(clean(item.releaseLink)));
        }

        entry.append(launch);
      }

      list.append(entry);
    });

    section.append(list);
    return section;
  }

  function createAwardSection(items, sectionNumber) {
    const section = createDocumentSection(sectionNumber, "수상 / 공모전 참가");
    const list = createElement("div", "resume-entry-list");

    items.forEach((item) => {
      const entry = createElement("article", "resume-entry");
      appendEntryHeading(entry, item.name, item.period);
      appendTextElement(entry, "p", "entry-subtitle", item.organizer);

      const resultAndRole = [clean(item.result), clean(item.role)]
        .filter(Boolean)
        .join(" · ");
      appendTextElement(entry, "p", "entry-detail", resultAndRole);
      appendTextElement(entry, "p", "entry-description", item.details);
      list.append(entry);
    });

    section.append(list);
    return section;
  }

  function createActivitySection(items, sectionNumber) {
    const section = createDocumentSection(sectionNumber, "대외활동 / 기타 경험");
    const list = createElement("div", "resume-entry-list");

    items.forEach((item) => {
      const entry = createElement("article", "resume-entry");
      appendEntryHeading(entry, item.name, item.period);

      const organizationAndType = [clean(item.organization), clean(item.type)]
        .filter(Boolean)
        .join(" · ");
      appendTextElement(entry, "p", "entry-subtitle", organizationAndType);
      appendLabeledText(entry, "역할", item.role);
      appendTextElement(entry, "p", "entry-description", item.details);
      list.append(entry);
    });

    section.append(list);
    return section;
  }

  function createCertificationSection(items, sectionNumber) {
    const section = createDocumentSection(sectionNumber, "자격증 / 어학 / 수료");
    const list = createElement("div", "credential-list");

    items.forEach((item) => {
      const entry = createElement("article", "credential-entry");
      const date = createElement("div", "entry-period");
      const body = document.createElement("div");

      date.textContent = clean(item.date);
      appendTextElement(body, "h3", "entry-title", item.name);

      const issuerAndCredential = [
        clean(item.issuer),
        clean(item.credential),
      ]
        .filter(Boolean)
        .join(" · ");
      appendTextElement(body, "p", "entry-subtitle", issuerAndCredential);
      appendTextElement(body, "p", "entry-note", item.details);

      if (date.textContent) {
        entry.append(date, body);
      } else {
        entry.classList.add("no-period");
        entry.append(body);
      }

      list.append(entry);
    });

    section.append(list);
    return section;
  }

  function createSkillsSection(skills, sectionNumber) {
    const section = createDocumentSection(sectionNumber, "보유 역량 / 활용 수준");
    const list = createElement("div", "skill-detail-list");

    skills.forEach((skill) => {
      const item = createElement("article", "skill-detail-entry");
      const name = createElement("h3", "skill-name");
      const level = createElement("p", "skill-level");

      name.textContent = clean(skill.name);
      level.textContent = clean(skill.level);

      if (name.textContent) item.append(name);
      if (level.textContent) item.append(level);
      list.append(item);
    });

    section.append(list);
    return section;
  }

  function appendEntryHeading(parent, rawTitle, rawPeriod) {
    const title = clean(rawTitle);
    const period = clean(rawPeriod);
    if (!title && !period) return;

    const heading = createElement("div", "project-heading");
    if (title) {
      const titleElement = createElement("h3", "entry-title");
      titleElement.textContent = title;
      heading.append(titleElement);
    }
    if (period) {
      const periodElement = createElement("span", "entry-period");
      periodElement.textContent = period;
      heading.append(periodElement);
    }
    parent.append(heading);
  }

  function appendTextElement(parent, tagName, className, rawValue) {
    const value = clean(rawValue);
    if (!value) return;
    const element = createElement(tagName, className);
    element.textContent = value;
    parent.append(element);
  }

  function appendLabeledText(parent, labelText, rawValue) {
    const value = clean(rawValue);
    if (!value) return;
    const paragraph = createElement("p", "entry-detail");
    const label = document.createElement("strong");
    label.textContent = labelText;
    paragraph.append(label, document.createTextNode(value));
    parent.append(paragraph);
  }

  function createEssaySection(items, sectionNumber) {
    const section = createDocumentSection(sectionNumber, "자기소개서");
    const list = createElement("div", "essay-list");

    items.forEach((item) => {
      const entry = createElement("article", "essay-entry");
      const question = createElement("h3", "essay-question");
      const answer = createElement("p", "essay-answer");

      question.textContent = `${item.number}. ${item.title}`;
      answer.textContent = item.value;
      entry.append(question, answer);
      list.append(entry);
    });

    section.append(list);
    return section;
  }

  function createDocumentSection(index, titleText) {
    const section = createElement("section", "document-section");
    const title = createElement("h2", "document-section-title");
    const indexText = createElement("span", "section-index");
    const label = document.createElement("span");

    indexText.textContent = index;
    label.textContent = titleText;
    title.append(indexText, label);
    section.append(title);
    return section;
  }

  function createEmptyDocumentMessage() {
    const wrapper = createElement("div", "empty-document");
    const message = document.createElement("p");
    const title = document.createElement("strong");

    title.textContent = "아직 작성한 내용이 없어요.";
    message.append(
      title,
      document.createTextNode(
        "왼쪽에서 기본 정보부터 작성해 보세요. 입력한 내용은 바로 이곳에 정리됩니다.",
      ),
    );
    wrapper.append(message);
    return wrapper;
  }

  function hasBasicContent() {
    return Object.values(state.student.basic).some((value) => Boolean(clean(value)));
  }

  function nonEmptyEducation() {
    return state.student.education.filter((item) =>
      ["institution", "course", "period", "grade", "learning", "note"].some((key) =>
        Boolean(clean(item[key])),
      ),
    );
  }

  function nonEmptyProjects() {
    return state.student.projects.filter((item) => {
      const fields = [
        "name",
        "period",
        "role",
        "tools",
        "summary",
        "retrospective",
        "image",
        "releaseLink",
      ];
      return (
        fields.some((key) => Boolean(clean(item[key]))) ||
        item.contributions.some((value) => Boolean(clean(value)))
      );
    });
  }

  function nonEmptyItems(type, fields) {
    const list = state.student[type];
    if (!Array.isArray(list)) return [];
    return list.filter((item) =>
      fields.some((field) => Boolean(clean(item[field]))),
    );
  }

  function nonEmptySkills() {
    return state.student.skills.filter(
      (item) => clean(item.name) || clean(item.level),
    );
  }

  function nonEmptyEssays() {
    return state.student.essays
      .filter((item) => clean(item.title) && clean(item.content))
      .map((item, index) => ({
        ...item,
        number: index + 1,
        value: clean(item.content),
      }));
  }

  function updateCompletionProgress() {
    const completedSections = [
      hasBasicContent(),
      nonEmptyEducation().length > 0,
      nonEmptyItems("workExperiences", [
        "organization",
        "type",
        "period",
        "role",
        "details",
        "achievements",
      ]).length > 0,
      nonEmptyProjects().length > 0,
      nonEmptyItems("awards", [
        "name",
        "organizer",
        "period",
        "result",
        "role",
        "details",
      ]).length > 0,
      nonEmptyItems("activities", [
        "name",
        "organization",
        "type",
        "period",
        "role",
        "details",
      ]).length > 0,
      nonEmptyItems("certifications", [
        "name",
        "issuer",
        "date",
        "credential",
        "details",
      ]).length > 0,
      nonEmptySkills().length > 0,
      nonEmptyEssays().length > 0,
    ].filter(Boolean).length;

    dom.completionProgress.value = completedSections;
    dom.progressText.textContent = `작성한 항목 ${completedSections} / 9`;
  }

  function renderEssayCounts() {
    state.student.essays.forEach((essay) => {
      const counter = dom.form.querySelector(
        `[data-essay-count="${essay.id}"]`,
      );
      if (counter) {
        counter.textContent = `${essay.content.length.toLocaleString("ko-KR")}자`;
      }
    });
  }

  function updatePresetNote() {
    dom.presetNote.textContent =
      LAYOUT_NOTES[state.template.layout] || LAYOUT_NOTES.standard;
  }

  function loadState() {
    const defaults = {
      student: createDefaultStudent(),
      template: createDefaultTemplate(),
    };

    try {
      const storedStudent = parseStoredJson(STORAGE_KEYS.student);
      const storedTemplate = parseStoredJson(STORAGE_KEYS.template);

      return {
        student: sanitizeStudent(storedStudent, defaults.student),
        template: sanitizeTemplate(storedTemplate, defaults.template),
      };
    } catch (error) {
      console.warn("저장 데이터를 불러오지 못해 기본값을 사용합니다.", error);
      return defaults;
    }
  }

  function parseStoredJson(key) {
    const value = localStorage.getItem(key);
    if (!value) return null;
    return JSON.parse(value);
  }

  function sanitizeStudent(source, fallback) {
    if (!source || typeof source !== "object") return fallback;

    const education = Array.isArray(source.education)
      ? source.education.map(sanitizeEducation).filter(Boolean)
      : fallback.education;
    const workExperiences = Array.isArray(source.workExperiences)
      ? source.workExperiences.map(sanitizeWorkExperience).filter(Boolean)
      : fallback.workExperiences;
    const projects = Array.isArray(source.projects)
      ? source.projects.map(sanitizeProject).filter(Boolean)
      : fallback.projects;
    const awards = Array.isArray(source.awards)
      ? source.awards.map(sanitizeAward).filter(Boolean)
      : fallback.awards;
    const activities = Array.isArray(source.activities)
      ? source.activities.map(sanitizeActivity).filter(Boolean)
      : fallback.activities;
    const certifications = Array.isArray(source.certifications)
      ? source.certifications.map(sanitizeCertification).filter(Boolean)
      : fallback.certifications;
    const skills = sanitizeSkills(source.skills);
    const essays = sanitizeEssays(source.essays, fallback.essays);

    return {
      basic: {
        ...fallback.basic,
        ...sanitizeTextObject(source.basic, Object.keys(fallback.basic)),
        photo: sanitizePhoto(source.basic?.photo),
      },
      education: education.length ? education : [createEmptyEducation()],
      workExperiences: workExperiences.length
        ? workExperiences
        : [createEmptyWorkExperience()],
      projects: projects.length ? projects : [createEmptyProject()],
      awards: awards.length ? awards : [createEmptyAward()],
      activities: activities.length ? activities : [createEmptyActivity()],
      certifications: certifications.length
        ? certifications
        : [createEmptyCertification()],
      skills: skills.length ? skills : [createEmptySkill()],
      essays,
    };
  }

  function sanitizeEducation(item) {
    if (!item || typeof item !== "object") return null;
    return {
      id: coerceText(item.id) || createId("education"),
      institution: coerceText(item.institution),
      course: coerceText(item.course),
      period: coerceText(item.period),
      grade: coerceText(item.grade),
      learning: coerceText(item.learning),
      note: coerceText(item.note),
    };
  }

  function sanitizeWorkExperience(item) {
    if (!item || typeof item !== "object") return null;
    return {
      id: coerceText(item.id) || createId("work"),
      organization: coerceText(item.organization),
      type: coerceText(item.type),
      period: coerceText(item.period),
      role: coerceText(item.role),
      details: coerceText(item.details),
      achievements: coerceText(item.achievements),
    };
  }

  function sanitizeProject(item) {
    if (!item || typeof item !== "object") return null;
    const contributions = Array.isArray(item.contributions)
      ? item.contributions.slice(0, 3).map(coerceText)
      : [];

    while (contributions.length < 3) contributions.push("");

    return {
      id: coerceText(item.id) || createId("project"),
      name: coerceText(item.name),
      period: coerceText(item.period),
      role: coerceText(item.role),
      tools: coerceText(item.tools),
      summary: coerceText(item.summary),
      retrospective: coerceText(item.retrospective),
      image: sanitizeProjectImage(item.image),
      releaseLink: coerceText(item.releaseLink),
      contributions,
    };
  }

  function sanitizeAward(item) {
    if (!item || typeof item !== "object") return null;
    return {
      id: coerceText(item.id) || createId("award"),
      name: coerceText(item.name),
      organizer: coerceText(item.organizer),
      period: coerceText(item.period),
      result: coerceText(item.result),
      role: coerceText(item.role),
      details: coerceText(item.details),
    };
  }

  function sanitizeActivity(item) {
    if (!item || typeof item !== "object") return null;
    return {
      id: coerceText(item.id) || createId("activity"),
      name: coerceText(item.name),
      organization: coerceText(item.organization),
      type: coerceText(item.type),
      period: coerceText(item.period),
      role: coerceText(item.role),
      details: coerceText(item.details),
    };
  }

  function sanitizeCertification(item) {
    if (!item || typeof item !== "object") return null;
    return {
      id: coerceText(item.id) || createId("certification"),
      name: coerceText(item.name),
      issuer: coerceText(item.issuer),
      date: coerceText(item.date),
      credential: coerceText(item.credential),
      details: coerceText(item.details),
    };
  }

  function sanitizeSkill(item) {
    if (!item || typeof item !== "object") return null;
    return {
      id: coerceText(item.id) || createId("skill"),
      name: coerceText(item.name),
      level: coerceText(item.level),
    };
  }

  function sanitizeEssay(item) {
    if (!item || typeof item !== "object") return null;
    return {
      id: coerceText(item.id) || createId("essay"),
      title: coerceText(item.title),
      content: coerceText(item.content),
      guide: coerceText(item.guide),
    };
  }

  function sanitizeEssays(source, fallback) {
    if (Array.isArray(source)) {
      return source.map(sanitizeEssay).filter(Boolean);
    }

    if (!source || typeof source !== "object") return fallback;

    const legacyFields = [
      ["motivation", DEFAULT_ESSAYS[0]],
      ["strength", DEFAULT_ESSAYS[1]],
      ["collaboration", DEFAULT_ESSAYS[2]],
      ["problemSolving", DEFAULT_ESSAYS[3]],
      ["goal", DEFAULT_ESSAYS[4]],
    ];

    return legacyFields.map(([key, meta]) => ({
      id: createId("essay"),
      title: meta.title,
      content: coerceText(source[key]),
      guide: meta.guide,
    }));
  }

  function sanitizeSkills(source) {
    if (Array.isArray(source)) {
      return source.map(sanitizeSkill).filter(Boolean);
    }

    if (!source || typeof source !== "object") return [];

    const migrated = [];
    if (Array.isArray(source.selected)) {
      source.selected.map(coerceText).filter(Boolean).forEach((name) => {
        migrated.push({
          id: createId("skill"),
          name,
          level: "",
        });
      });
    }

    clean(source.custom)
      .split(",")
      .map(clean)
      .filter(Boolean)
      .forEach((name) => {
        migrated.push({
          id: createId("skill"),
          name,
          level: "",
        });
      });

    return migrated;
  }

  function sanitizeTemplate(source, fallback) {
    if (!source || typeof source !== "object") return fallback;

    const validLayouts = [
      "standard",
      "compact",
      "review",
      "timeline",
      "portfolio",
    ];
    const validFontSizes = ["small", "medium", "large"];
    const validPageMargins = ["preset", "narrow", "normal", "wide"];
    const validSectionSpacings = ["preset", "tight", "normal", "relaxed"];
    const validHeadingStyles = ["preset", "line", "numbered", "minimal"];
    const validTitleAlignments = ["left", "center"];
    const previousDefaultIntro =
      "아래 문서는 입력된 내용을 바탕으로 제출용 가독성을 갖추어 정리한 취업 문서입니다.";
    const savedIntro =
      typeof source.intro === "string" ? source.intro : fallback.intro;

    return {
      visibility: {
        basic: readBoolean(source.visibility?.basic, fallback.visibility.basic),
        education: readBoolean(
          source.visibility?.education,
          fallback.visibility.education,
        ),
        workExperiences: readBoolean(
          source.visibility?.workExperiences,
          fallback.visibility.workExperiences,
        ),
        projects: readBoolean(
          source.visibility?.projects,
          fallback.visibility.projects,
        ),
        awards: readBoolean(
          source.visibility?.awards,
          fallback.visibility.awards,
        ),
        activities: readBoolean(
          source.visibility?.activities,
          fallback.visibility.activities,
        ),
        certifications: readBoolean(
          source.visibility?.certifications,
          fallback.visibility.certifications,
        ),
        skills: readBoolean(source.visibility?.skills, fallback.visibility.skills),
        essays: readBoolean(source.visibility?.essays, fallback.visibility.essays),
      },
      title: coerceText(source.title) || fallback.title,
      intro: savedIntro === previousDefaultIntro ? fallback.intro : savedIntro,
      layout: validLayouts.includes(source.layout)
        ? source.layout
        : fallback.layout,
      fontSize: validFontSizes.includes(source.fontSize)
        ? source.fontSize
        : fallback.fontSize,
      pageMargin: validPageMargins.includes(source.pageMargin)
        ? source.pageMargin
        : fallback.pageMargin,
      sectionSpacing: validSectionSpacings.includes(source.sectionSpacing)
        ? source.sectionSpacing
        : fallback.sectionSpacing,
      headingStyle: validHeadingStyles.includes(source.headingStyle)
        ? source.headingStyle
        : fallback.headingStyle,
      titleAlign: validTitleAlignments.includes(source.titleAlign)
        ? source.titleAlign
        : fallback.titleAlign,
      sectionOrder: sanitizeSectionOrder(source.sectionOrder),
    };
  }

  function sanitizeSectionOrder(source) {
    const validKeys = SECTION_DEFINITIONS.map((section) => section.key);
    const savedOrder = Array.isArray(source)
      ? source.filter((key) => validKeys.includes(key))
      : [];
    return [...new Set([...savedOrder, ...validKeys])];
  }

  function sanitizeTextObject(source, keys) {
    if (!source || typeof source !== "object") return {};
    return Object.fromEntries(keys.map((key) => [key, coerceText(source[key])]));
  }

  function readBoolean(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
  }

  function coerceText(value) {
    return typeof value === "string" ? value : "";
  }

  function sanitizePhoto(value) {
    const text = coerceText(value);
    return /^data:image\/(?:jpeg|png|webp);base64,/i.test(text) ? text : "";
  }

  function sanitizeProjectImage(value) {
    return sanitizePhoto(value);
  }

  function scheduleSave() {
    window.clearTimeout(saveTimer);
    setSaveStatus("저장 중이에요…", "saving");
    saveTimer = window.setTimeout(saveStateNow, 350);
  }

  function saveStateNow() {
    window.clearTimeout(saveTimer);

    try {
      localStorage.setItem(STORAGE_KEYS.student, JSON.stringify(state.student));
      localStorage.setItem(STORAGE_KEYS.template, JSON.stringify(state.template));
      setSaveStatus("자동 저장됐어요", "saved");
    } catch (error) {
      console.warn("자동 저장에 실패했습니다.", error);
      setSaveStatus("저장하지 못했어요", "error");
    }
  }

  function setSaveStatus(message, status) {
    dom.saveStatus.textContent = message;
    dom.saveStatus.dataset.state = status;
  }

  function resetAllData() {
    const confirmed = window.confirm(
      "지금까지 작성한 내용과 문서 설정을 모두 지울까요? 삭제한 내용은 다시 되돌릴 수 없어요.",
    );
    if (!confirmed) return;

    state = {
      student: createDefaultStudent(),
      template: createDefaultTemplate(),
    };
    renderRepeaters();
    syncFormFromState();
    renderPreview();
    renderEssayCounts();
    updatePresetNote();
    dom.photoInput.value = "";
    setPhotoStatus("JPG, PNG, WEBP / 8MB 이하 권장");
    saveStateNow();
  }

  function loadSampleData() {
    const hasCurrentInput = hasAnyStudentInput();
    if (
      hasCurrentInput &&
      !window.confirm("지금 작성한 내용을 지우고 예시 내용으로 채워볼까요?")
    ) {
      return;
    }

    state.student = createSampleStudent();
    renderRepeaters();
    syncFormFromState();
    renderPreview();
    renderEssayCounts();
    dom.photoInput.value = "";
    setPhotoStatus("예시에는 사진이 들어 있지 않아요. 필요하면 직접 추가해 주세요.");
    saveStateNow();
  }

  function hasAnyStudentInput() {
    return (
      hasBasicContent() ||
      nonEmptyEducation().length > 0 ||
      nonEmptyItems("workExperiences", [
        "organization",
        "type",
        "period",
        "role",
        "details",
        "achievements",
      ]).length > 0 ||
      nonEmptyProjects().length > 0 ||
      nonEmptyItems("awards", [
        "name",
        "organizer",
        "period",
        "result",
        "role",
        "details",
      ]).length > 0 ||
      nonEmptyItems("activities", [
        "name",
        "organization",
        "type",
        "period",
        "role",
        "details",
      ]).length > 0 ||
      nonEmptyItems("certifications", [
        "name",
        "issuer",
        "date",
        "credential",
        "details",
      ]).length > 0 ||
      nonEmptySkills().length > 0 ||
      nonEmptyEssays().length > 0
    );
  }

  function announcePreviewRefresh() {
    const originalText = dom.refreshButton.textContent;
    dom.refreshButton.textContent = "문서에 반영됐어요";
    window.setTimeout(() => {
      dom.refreshButton.textContent = originalText;
    }, 900);
  }

  function getPath(object, path) {
    return path.split(".").reduce((value, key) => value?.[key], object);
  }

  function setPath(object, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => current[key], object);
    target[lastKey] = value;
  }

  function clean(value) {
    return coerceText(value).trim();
  }

  function normalizeUrl(value) {
    const text = clean(value);
    if (!text) return "";

    try {
      const candidate = /^[a-z][a-z\d+.-]*:/i.test(text)
        ? text
        : `https://${text}`;
      const url = new URL(candidate);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function createElement(tagName, className = "") {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    return element;
  }

  init();
})();
