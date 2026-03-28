const UNIT_CODE_REGEX = /\b[A-Z]{3,4}\d{4}\b/g;

const parseSortValue = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
};

const getRelationshipCode = (relationship) => {
  if (relationship?.academic_item_code) {
    return relationship.academic_item_code.toUpperCase();
  }

  const value = relationship?.academic_item?.value || '';
  const match = value.match(UNIT_CODE_REGEX);
  return match ? match[0].toUpperCase() : null;
};

const getConnector = (item) => {
  const connector =
    item?.parent_connector?.value ||
    item?.connector?.value ||
    item?.connector ||
    'AND';

  return connector.toUpperCase() === 'OR' ? 'OR' : 'AND';
};

const getContainerSort = (container) => {
  if (container?.order) {
    return parseSortValue(container.order);
  }

  if (container?.title) {
    const match = container.title.match(/(\d+(?:\.\d+)*)$/);
    return match ? parseSortValue(match[1]) : Number.POSITIVE_INFINITY;
  }

  return Number.POSITIVE_INFINITY;
};

const getRelationshipSort = (relationship) => {
  if (relationship?.order) {
    return parseSortValue(relationship.order);
  }

  return Number.POSITIVE_INFINITY;
};

const evaluateContainer = (container, completedCodes) => {
  const items = [];

  (container?.containers || []).forEach((child) => {
    items.push({
      kind: 'container',
      connector: getConnector(child),
      sortValue: getContainerSort(child),
      value: evaluateContainer(child, completedCodes)
    });
  });

  (container?.relationships || []).forEach((relationship) => {
    const code = getRelationshipCode(relationship);
    if (!code) {
      return;
    }

    items.push({
      kind: 'relationship',
      connector: getConnector(relationship),
      sortValue: getRelationshipSort(relationship),
      code,
      value: completedCodes.has(code)
    });
  });

  if (items.length === 0) {
    return true;
  }

  items.sort((a, b) => a.sortValue - b.sortValue);

  let result = items[0].value;
  for (let i = 1; i < items.length; i += 1) {
    const item = items[i];
    result = item.connector === 'OR' ? result || item.value : result && item.value;
  }

  return result;
};

const collectCodesFromContainer = (container, outputSet) => {
  (container?.relationships || []).forEach((relationship) => {
    const code = getRelationshipCode(relationship);
    if (code) {
      outputSet.add(code);
    }
  });

  (container?.containers || []).forEach((child) => {
    collectCodesFromContainer(child, outputSet);
  });
};

export const parseHandbookRequisites = (html) => {
  if (!html) {
    return [];
  }

  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );

  if (!nextDataMatch) {
    return [];
  }

  const nextData = JSON.parse(nextDataMatch[1]);
  const requisites = nextData?.props?.pageProps?.pageContent?.requisites;

  if (!Array.isArray(requisites)) {
    return [];
  }

  return requisites.map((requisite) => {
    const type = (requisite?.requisite_type?.value || requisite?.requisite_type?.label || '')
      .toString()
      .toLowerCase();

    const containers = Array.isArray(requisite?.container) ? requisite.container : [];
    const codes = new Set();
    containers.forEach((container) => collectCodesFromContainer(container, codes));

    return {
      type,
      containers,
      unitCodes: [...codes]
    };
  });
};

export const evaluateRequisite = (rule, completedCodes) => {
  const containers = Array.isArray(rule?.containers) ? rule.containers : [];

  if (containers.length === 0) {
    return true;
  }

  const containerResults = containers.map((container) => ({
    connector: getConnector(container),
    value: evaluateContainer(container, completedCodes)
  }));

  let result = containerResults[0].value;
  for (let i = 1; i < containerResults.length; i += 1) {
    const item = containerResults[i];
    result = item.connector === 'OR' ? result || item.value : result && item.value;
  }

  return result;
};

export const extractUnitCodes = (rules = []) => {
  const allCodes = new Set();
  rules.forEach((rule) => {
    (rule?.unitCodes || []).forEach((code) => {
      allCodes.add(code);
    });
  });
  return [...allCodes];
};
