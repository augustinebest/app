const sortByName = data => {
    return data && data.length > 0 ? data.sort(compare) : [];
};

const compare = (a, b) => {
    if (!a || !b || !a.name || !b.name) {
        return 0;
    }

    const objectA = a.name.toLowerCase();
    const objectB = b.name.toLowerCase();

    if (objectA > objectB) {
        return 1;
    }
    if (objectA < objectB) {
        return -1;
    }
    return 0;
};

export default sortByName;
