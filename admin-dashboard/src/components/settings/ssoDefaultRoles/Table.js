import React from 'react';
import PropTypes from 'prop-types';
import TableBody from './TableBody';
import TableHeader from './TableHeader';
const Table = ({ ssoDefaultRoles }) => (
    <table className="Table">
        <TableHeader />
        <TableBody ssoDefaultRoles={ssoDefaultRoles} />
    </table>
);

Table.displayName = 'Table';

Table.propTypes = {
    ssoDefaultRoles: PropTypes.string,
};

export default Table;
