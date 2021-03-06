import React from 'react';
import PropTypes from 'prop-types';

import { day, dollars } from '../format';
import webComponent from '../web-component';


function name(contribution) {
  return [contribution.Tran_NamF, contribution.Tran_NamL]
    .filter(v => !!v)
    .join(' ');
}

class ContributionsTable extends React.Component {
  static initialState(contributions) {
    return {
      contributions: contributions.map((contribution, i) => ({
        id: i,
        name: name(contribution),
        amount: contribution.Tran_Amt1,
        date: new Date(contribution.Tran_Date),
      })),
      filter: '',
      // Initial state is sorting by amount, "ascending", note that the columns
      // have different definitions of ascending/descending, see `applySortOrder`
      // below.
      sort: {
        order: 1,
        column: 'amount',
      },
    };
  }

  /**
   * Parses HTML attributes to props
   */
  static parseAttributes(attributes) {
    const contributions = JSON.parse(attributes.contributions ?
      attributes.contributions.value : []);
    return {
      contributions,
    };
  }

  constructor(props) {
    super(props);
    this.state = ContributionsTable.initialState(props.contributions);
  }

  /**
   * applyFilter
   *
   * Applies the filter text against the contributions names and returns only
   * the contributions that match the filter. Names and the filter are
   * tokenized (broken by white-space and normalized) before being matched. For
   * example, given the filter 'reb kap', should match the contribution name
   * 'Rebecca Kaplan'.
   *
   * @param {array} contributions the source array of contributions.
   * @returns {array} the contributions matching the filter.
   */
  applyFilter(contributions) {
    const { filter } = this.state;
    if (!filter) {
      return contributions;
    }

    function tokenize(data) {
      // Lowercases everything and split by white-space
      return data.toLowerCase().split(/\s+/g);
    }

    return contributions
      .filter((contribution) => {
        const tokens = tokenize(contribution.name);
        const queries = tokenize(filter);

        // Every query needs to match at least one token. It's considered a
        // match when the query matches the first part of the token.
        return queries.every(query =>
          tokens.some(token => token.startsWith(query)));
      });
  }

  applySortOrder(contributions) {
    const { sort } = this.state;
    function difference(a, b) {
      // We're doing some funkiness with ascending/decsending based on the
      // column to give a _maybe_ more intuitive behavior. The default sort is
      // ascending, but if you sort by amount, you probably want that to start in
      // descending order, so a/b are swapped. Similar with date, where you
      // want to see the recent contributions for the initial sort.
      switch (sort.column) {
        case 'amount':
          return b.amount - a.amount;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return b.date.valueOf() - a.date.valueOf();
        default:
          return 0;
      }
    }

    return contributions
      .map(x => x) // Create a new array to avoid sort mutating the state
      .sort((a, b) => sort.order * difference(a, b));
  }

  render() {
    const { contributions } = this.state;
    const sortToggle = column => () => {
      const currentSort = this.state.sort;
      if (currentSort.column === column) {
        // Already sorting on this column, toggle the order
        this.setState({
          sort: {
            column,
            order: currentSort.order * -1,
          },
        });
        return;
      }

      // Set the new sort column in the ascending state
      this.setState({
        sort: {
          column,
          order: 1,
        },
      });
    };

    const isActive = (colName) => {
      const currentSort = this.state.sort;
      if (this.state.sort.column !== colName) {
        return '';
      } else if (currentSort.order === 1) {
        return ' is-descending';
      }
      return ' is-ascending';
    };

    const updateFilter = (e) => {
      this.setState({
        filter: e.target.value,
      });
    };

    return (
      <div>
        <input className="filter" value={this.state.filterField} onChange={updateFilter} type="text" placeholder="Type to filter contributions" />
        <table className="contributors">
          <thead className="contributors__thead">
            <tr>
              <th className={`contributors__name${isActive('name')}`}>
                <button type="button" className="sort-button" onClick={sortToggle('name')}>
                  Name
                  <span className="arrow-container" />
                </button>
              </th>
              <th className={`contributors__amount${isActive('amount')}`}>
                <button type="button" className="sort-button amount" onClick={sortToggle('amount')}>
                  Amount
                  <span className="arrow-container" />
                </button>
              </th>
              <th className={`contributors__date contributors__col--s1${isActive('date')}`}>
                <button type="button" className="sort-button" onClick={sortToggle('date')}>
                  Date
                  <span className="arrow-container" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {
              this.applySortOrder(this.applyFilter(contributions)).map(contribution => (
                <tr key={contribution.id}>
                  <td className="contributors__name">{contribution.name}</td>
                  <td className="contributors__amount">{dollars(contribution.amount)}</td>
                  <td className="contributors__date contributors__col--s1">{day(contribution.date)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    );
  }
}

ContributionsTable.propTypes = {
  contributions: PropTypes.arrayOf(PropTypes.shape({
    Tran_Amt1: PropTypes.number.isRequired,
    Tran_Date: PropTypes.string.isRequired,
    Tran_NamL: PropTypes.string.isRequired,
    Tran_NamF: PropTypes.string,
  })),
};

ContributionsTable.defaultProps = {
  contributions: [],
};


export default webComponent(ContributionsTable, 'contributions-table');
