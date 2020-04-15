// Shows rollup data from Foorm surveys. Shows average data for this workshop
// and across all workshops for this course
// TODO: show facilitator averages
import React from 'react';
import PropTypes from 'prop-types';
import * as Table from 'reactabular-table';

const styles = {
  title: {
    paddingLeft: '30px'
  },
  question: {
    paddingLeft: '60px'
  },
  headerRow: {
    borderTop: 'solid'
  }
};

export default class SurveyRollupTableFoorm extends React.Component {
  static propTypes = {
    workshopRollups: PropTypes.object.isRequired,
    questions: PropTypes.object.isRequired,
    courseName: PropTypes.string.isRequired,
    isPerFacilitator: PropTypes.bool.isRequired,
    facilitators: PropTypes.object
  };

  // parse row data into format reactabular-table can parse. Each row may contain the following data:
  // {question: {text: <question-text>, type: overall/title/question},
  //             thisWorkshop: <this workshop average>, overall: <overall average>,
  //             id: <id>, isHeader: true/false}
  getTableRows() {
    const {workshopRollups} = this.props;
    let rows = [];
    let responseCounts = {
      question: {
        text: 'Total Responses',
        type: 'overall'
      },
      overall: workshopRollups.overall.response_count,
      id: 'total_responses'
    };
    if (this.props.isPerFacilitator) {
      for (const facilitator in this.props.facilitators) {
        responseCounts[`thisWorkshop-${facilitator}`] =
          workshopRollups.single_workshop[facilitator].response_count;
      }
    } else {
      responseCounts.thisWorkshop =
        workshopRollups.single_workshop.response_count;
    }
    for (const facilitator in this.props.facilitators) {
      responseCounts[`facilitatorAverage-${facilitator}`] =
        workshopRollups.overall_facilitator[facilitator].response_count;
    }
    rows.push(responseCounts);

    const overall = workshopRollups.overall;
    const thisWorkshop = workshopRollups.single_workshop;
    const overallFacilitator = workshopRollups.overall_facilitator;
    const questions = workshopRollups.questions;
    if (overall && overall.averages) {
      for (const questionId in overall.averages) {
        const questionData = questions[questionId];
        let overallQuestionAverages = overall.averages[questionId];
        let thisWorkshopAverages = this.props.isPerFacilitator
          ? {}
          : thisWorkshop.averages[questionId];
        let overallFacilitatorAverages = {};
        if (this.props.isPerFacilitator && thisWorkshop) {
          for (const facilitator in thisWorkshop) {
            if (thisWorkshop[facilitator].averages[questionId]) {
              thisWorkshopAverages[facilitator] =
                thisWorkshop[facilitator].averages[questionId];
            }
          }
        }
        for (const facilitator in overallFacilitator) {
          if (overallFacilitator[facilitator].averages[questionId]) {
            overallFacilitatorAverages[facilitator] =
              overallFacilitator[facilitator].averages[questionId];
          }
        }
        if (questionData.type === 'matrix') {
          this.parseMatrixData(
            rows,
            questionData,
            questionId,
            thisWorkshopAverages,
            overallFacilitatorAverages,
            overallQuestionAverages
          );
        }
      }
    }
    return rows;
  }

  getTableColumns() {
    let columns = [
      {
        property: 'question',
        cell: {
          formatters: [question => question.text],
          transforms: [
            question => ({
              style:
                question.type === 'overall'
                  ? {}
                  : question.type === 'title'
                  ? styles.title
                  : styles.question
            })
          ]
        }
      }
    ];
    this.addThisWorkshopColumns(columns);
    columns.push({
      property: 'overall',
      header: {
        label: `Average across all ${this.props.courseName} workshops`
      }
    });
    return columns;
  }

  addThisWorkshopColumns(columns) {
    if (!this.props.isPerFacilitator) {
      columns.push({
        property: 'thisWorkshop',
        header: {
          label: `Average for this workshop`
        }
      });
    }
    let columnLabels = [];
    for (const facilitator in this.props.facilitators) {
      columnLabels.push({
        thisWorkshopLabel: `${
          this.props.facilitators[facilitator]
        }'s average for this workshop`,
        averageLabel: `Average across all of ${
          this.props.facilitators[facilitator]
        }'s ${this.props.courseName} workshops`,
        id: facilitator
      });
    }
    for (const columnLabel of columnLabels) {
      if (this.props.isPerFacilitator) {
        columns.push({
          property: `thisWorkshop-${columnLabel.id}`,
          header: {
            label: columnLabel.thisWorkshopLabel
          }
        });
      }
      columns.push({
        property: `facilitatorAverage-${columnLabel.id}`,
        header: {
          label: columnLabel.averageLabel
        }
      });
    }
  }

  parseMatrixData(
    rows,
    questionData,
    questionId,
    thisWorkshopAverages,
    overallFacilitatorAverages,
    overallQuestionAverages
  ) {
    let denominator = questionData.column_count;
    // add matrix category
    let overallData = {
      question: {
        text: questionData.header,
        type: 'overall'
      },
      overall: `${overallQuestionAverages.average} / ${denominator}`,
      id: `${questionId}-category`,
      isHeader: true
    };
    if (this.props.isPerFacilitator) {
      this.addFacilitatorAverageToRow(
        thisWorkshopAverages,
        overallData,
        denominator,
        'thisWorkshop'
      );
    } else if (thisWorkshopAverages) {
      overallData['thisWorkshop'] = `${
        thisWorkshopAverages.average
      } / ${denominator}`;
    }

    this.addFacilitatorAverageToRow(
      overallFacilitatorAverages,
      overallData,
      denominator,
      'facilitatorAverage'
    );
    rows.push(overallData);
    // add top level question
    rows.push({
      question: {
        text: questionData.title,
        type: 'title'
      },
      id: questionId
    });
    // add individual rows
    for (const rowId in overallQuestionAverages.rows) {
      let rowData = {
        question: {
          text: questionData.rows[rowId],
          type: 'question'
        },
        overall: `${overallQuestionAverages.rows[rowId]} / ${denominator}`,
        id: rowId
      };
      if (this.props.isPerFacilitator) {
        this.addPerQuestionAverageToRow(
          rowData,
          rowId,
          thisWorkshopAverages,
          denominator,
          'thisWorkshop'
        );
      } else if (thisWorkshopAverages && thisWorkshopAverages.rows) {
        rowData['thisWorkshop'] = `${
          thisWorkshopAverages.rows[rowId]
        } / ${denominator}`;
      }
      this.addPerQuestionAverageToRow(
        rowData,
        rowId,
        overallFacilitatorAverages,
        denominator,
        'facilitatorAverage'
      );
      rows.push(rowData);
    }
  }

  addFacilitatorAverageToRow(averages, row, denominator, key) {
    for (const facilitator in averages) {
      row[`${key}-${facilitator}`] = `${
        averages[facilitator].average
      } / ${denominator}`;
    }
  }

  addPerQuestionAverageToRow(row, rowId, averages, denominator, key) {
    for (const facilitator in averages) {
      if (averages[facilitator].rows[rowId]) {
        row[`${key}-${facilitator}`] = `${
          averages[facilitator].rows[rowId]
        } / ${denominator}`;
      }
    }
  }

  // parse row data for a set of select answers
  parseSelectData(
    rows,
    questionData,
    questionId,
    thisWorkshopAverage,
    overallQuestionAverage
  ) {
    let denominator = questionData.column_count;
    rows.push({
      question: {
        text: questionData.title,
        type: 'overall'
      },
      thisWorkshop: thisWorkshopAverage
        ? `${thisWorkshopAverage} / ${denominator}`
        : '',
      overall: `${overallQuestionAverage} / ${denominator}`,
      id: questionId,
      isHeader: true
    });
  }

  render() {
    const rows = this.getTableRows();
    const columns = this.getTableColumns();
    return (
      <Table.Provider className="table table-bordered" columns={columns}>
        <Table.Header />
        <Table.Body
          rows={rows}
          rowKey="id"
          onRow={row => {
            return {style: row.isHeader ? styles.headerRow : {}};
          }}
        />
      </Table.Provider>
    );
  }
}
