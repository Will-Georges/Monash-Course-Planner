const UNIT_CODE_REGEX = /\b[A-Z]{3,4}\d{4}\b/g;

const extractNextData = (html) => {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );

  if (!match) {
    return null;
  }

  return JSON.parse(match[1]);
};

const extractUnitsFromRelationships = (relationships = []) => {
  const unitCodes = [];

  relationships.forEach((relationship) => {
    const typeLabel = relationship?.academic_item_type?.label?.toLowerCase();
    if (typeLabel && typeLabel !== 'unit') {
      return;
    }

    const value = relationship?.child_record?.value || '';
    const directCode = relationship?.academic_item_code;
    const matched = value.match(UNIT_CODE_REGEX);
    const code = (directCode || matched?.[0] || '').toUpperCase();

    if (code) {
      unitCodes.push(code);
    }
  });

  return unitCodes;
};

const getPartOrder = (title = '') => {
  const firstLetter = (title.match(/Part\s+([A-Z])/i)?.[1] || '').toUpperCase();
  if (!firstLetter) {
    return 99;
  }
  return firstLetter.charCodeAt(0) - 'A'.charCodeAt(0);
};

export const parseCourseMapUnits = (html) => {
  const nextData = extractNextData(html);
  const pageContent = nextData?.props?.pageProps?.pageContent;
  const containers = pageContent?.curriculumStructure?.container;

  if (!Array.isArray(containers)) {
    return [];
  }

  const collected = [];

  const walk = (container, context = { priority: 0 }) => {
    const title = (container?.title || '').toString();
    const descriptionText = (container?.description || '').toString().toLowerCase();
    const partOrder = getPartOrder(title);
    const hasChoiceLanguage = descriptionText.includes('one of the following');
    const relationships = Array.isArray(container?.relationship) ? container.relationship : [];
    const children = Array.isArray(container?.container) ? container.container : [];

    extractUnitsFromRelationships(relationships).forEach((code, idx) => {
      collected.push({
        code,
        partOrder: partOrder === 99 ? context.priority : partOrder,
        withinPartOrder: idx
      });
    });

    if (children.length === 0) {
      return;
    }

    // If this group is explicitly "one of the following", we use the first option as default preload.
    if (hasChoiceLanguage) {
      walk(children[0], { priority: partOrder === 99 ? context.priority + 1 : partOrder + 1 });
      return;
    }

    children.forEach((child, idx) => {
      walk(child, { priority: partOrder === 99 ? context.priority + idx + 1 : partOrder + idx + 1 });
    });
  };

  containers.forEach((container, idx) => walk(container, { priority: idx }));

  const seen = new Set();
  return collected
    .sort((a, b) => {
      if (a.partOrder !== b.partOrder) {
        return a.partOrder - b.partOrder;
      }
      return a.withinPartOrder - b.withinPartOrder;
    })
    .map((item) => item.code)
    .filter((code) => {
      if (seen.has(code)) {
        return false;
      }
      seen.add(code);
      return true;
    });
};
