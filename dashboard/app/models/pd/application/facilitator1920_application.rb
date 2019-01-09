# == Schema Information
#
# Table name: pd_applications
#
#  id                          :integer          not null, primary key
#  user_id                     :integer
#  type                        :string(255)      not null
#  application_year            :string(255)      not null
#  application_type            :string(255)      not null
#  regional_partner_id         :integer
#  status                      :string(255)
#  locked_at                   :datetime
#  notes                       :text(65535)
#  form_data                   :text(65535)      not null
#  created_at                  :datetime         not null
#  updated_at                  :datetime         not null
#  course                      :string(255)
#  response_scores             :text(65535)
#  application_guid            :string(255)
#  accepted_at                 :datetime
#  properties                  :text(65535)
#  deleted_at                  :datetime
#  status_timestamp_change_log :text(65535)
#
# Indexes
#
#  index_pd_applications_on_application_guid     (application_guid)
#  index_pd_applications_on_application_type     (application_type)
#  index_pd_applications_on_application_year     (application_year)
#  index_pd_applications_on_course               (course)
#  index_pd_applications_on_regional_partner_id  (regional_partner_id)
#  index_pd_applications_on_status               (status)
#  index_pd_applications_on_type                 (type)
#  index_pd_applications_on_user_id              (user_id)
#

module Pd::Application
  class Facilitator1920Application < FacilitatorApplicationBase
    include Pd::Facilitator1920ApplicationConstants

    validates_uniqueness_of :user_id

    has_one :pd_fit_weekend1920_registration,
      class_name: 'Pd::FitWeekend1920Registration',
      foreign_key: 'pd_application_id'

    serialized_attrs %w(
      status_log
    )

    before_save :log_status, if: -> {status_changed?}

    #override
    def year
      YEAR_19_20
    end

    # Are we still accepting applications?
    APPLICATION_CLOSE_DATE = Date.new(2019, 2, 1)
    def self.open?
      Time.zone.now < APPLICATION_CLOSE_DATE
    end

    # Queries for locked and (accepted or withdrawn) and assigned to a fit workshop
    # @param [ActiveRecord::Relation<Pd::Application::Facilitator1920Application>] applications_query
    #   (optional) defaults to all
    # @note this is not chainable since it inspects fit_workshop_id from serialized attributes,
    #   which must be done in the model.
    # @return [array]
    def self.fit_cohort(applications_query = all)
      applications_query.
        where(type: name).
        where(status: [:accepted, :withdrawn]).
        where.not(locked_at: nil).
        includes(:pd_fit_weekend1920_registration).
        select(&:fit_workshop_id?)
    end

    # @override
    def check_idempotency
      Pd::Application::Facilitator1920Application.find_by(user: user)
    end

    def fit_weekend_registration
      Pd::FitWeekend1920Registration.find_by_pd_application_id(id)
    end

    # @override
    # @param [Pd::Application::Email] email
    # Note - this should only be called from within Pd::Application::Email.send!
    def deliver_email(email)
      unless email.pd_application_id == id
        raise "Expected application id #{id} from email #{email.id}. Actual: #{email.pd_application_id}"
      end

      # email_type maps to the mailer action
      Facilitator1920ApplicationMailer.send(email.email_type, self).deliver_now
    end

    def log_status
      self.status_log ||= []
      status_log.push({status: status, at: Time.zone.now})
    end

    # memoize in a hash, per course
    FILTERED_LABELS ||= Hash.new do |h, key|
      labels_to_remove = key == 'csf' ?
        [
          :csd_csp_lead_summer_workshop_requirement,
          :csd_csp_which_fit_weekend,
          :csd_csp_workshop_requirement,
          :csd_csp_lead_summer_workshop_requirement,
          :csd_csp_deeper_learning_requirement,
          :csd_csp_good_standing_requirement,
          :csd_csp_partner_with_summer_workshop,
          :csd_csp_which_summer_workshop
        ]
        : # csd / csp
        [
          :csf_good_standing_requirement,
          :csf_summit_requirement,
          :csf_workshop_requirement,
          :csf_community_requirement
        ]

      h[key] = ALL_LABELS_WITH_OVERRIDES.except(*labels_to_remove)
    end

    # @override
    # Filter out extraneous answers, based on selected program (course)
    def self.filtered_labels(course)
      raise "Invalid course #{course}" unless VALID_COURSES.include?(course)
      FILTERED_LABELS[course]
    end

    # @override
    def self.csv_header(course, user)
      # strip all markdown formatting out of the labels
      markdown = Redcarpet::Markdown.new(Redcarpet::Render::StripDown)
      CSV.generate do |csv|
        columns = filtered_labels(course).values.map {|l| markdown.render(l)}.map(&:strip)
        columns.push(
          'Status',
          'Locked',
          'Notes',
          'Notes 2',
          'Notes 3',
          'Notes 4',
          'Notes 5',
          'Question 1 Support Teachers',
          'Question 2 Student Access',
          'Question 3 Receive Feedback',
          'Question 4 Give Feedback',
          'Question 5 Redirect Conversation',
          'Question 6 Time Commitment',
          'Question 7 Regional Needs',
          'Regional Partner'
        )
        csv << columns
      end
    end

    def self.cohort_csv_header(optional_columns)
      columns = [
        'Date Accepted',
        'Name',
        'School District',
        'School Name',
        'Email',
        'Status',
        'Assigned Workshop'
      ]
      if optional_columns[:registered_workshop]
        columns.push 'Registered Workshop'
      end
      if optional_columns[:accepted_teachercon]
        columns.push 'Accepted Teachercon'
      end

      columns.push(
        'Notes',
        'Notes 2',
        'Notes 3',
        'Notes 4',
        'Notes 5',
        'Question 1 Support Teachers',
        'Question 2 Student Access',
        'Question 3 Receive Feedback',
        'Question 4 Give Feedback',
        'Question 5 Redirect Conversation',
        'Question 6 Time Commitment',
        'Question 7 Regional Needs'
      )

      CSV.generate do |csv|
        csv << columns
      end
    end

    # @override
    def to_csv_row(user)
      answers = full_answers
      CSV.generate do |csv|
        row = self.class.filtered_labels(course).keys.map {|k| answers[k]}
        row.push(
          status,
          locked?,
          notes,
          notes_2,
          notes_3,
          notes_4,
          notes_5,
          question_1,
          question_2,
          question_3,
          question_4,
          question_5,
          question_6,
          question_7,
          regional_partner_name
        )
        csv << row
      end
    end

    def to_cohort_csv_row(optional_columns)
      columns = [
        date_accepted,
        applicant_name,
        district_name,
        school_name,
        user.email,
        status,
        fit_workshop_date_and_location
      ]
      if optional_columns[:registered_workshop]
        if workshop.try(:local_summer?)
          columns.push(registered_workshop? ? 'Yes' : 'No')
        else
          columns.push nil
        end
      end
      if optional_columns[:accepted_teachercon]
        if workshop.try(:teachercon?)
          columns.push(pd_teachercon1819_registration ? 'Yes' : 'No')
        else
          columns.push nil
        end
      end

      columns.push(
        notes,
        notes_2,
        notes_3,
        notes_4,
        notes_5,
        question_1,
        question_2,
        question_3,
        question_4,
        question_5,
        question_6,
        question_7
      )

      CSV.generate do |csv|
        csv << columns
      end
    end

    # @override
    def default_response_score_hash
      {
        meets_minimum_criteria_scores: {},
        bonus_points_scores: {}
      }
    end

    def meets_criteria
      response_scores = response_scores_hash[:meets_minimum_criteria_scores] || {}

      scores = response_scores.values

      if scores.uniq == [YES]
        YES
      elsif NO.in? scores
        NO
      else
        REVIEWING_INCOMPLETE
      end
    end

    def total_score
      (response_scores_hash[:bonus_points_scores] || {}).values.map(&:to_i).reduce(:+) || 0
    end

    def all_scores
      bonus_points_scores = response_scores_hash[:bonus_points_scores]
      all_score_hash = {
        total_score: "#{bonus_points_scores.values.map(&:to_i).reduce(:+) || 0} / #{SCOREABLE_QUESTIONS[:bonus_points].size * 5}"
      }

      BONUS_POINT_CATEGORIES.each_pair do |category, keys|
        all_score_hash[category] = "#{bonus_points_scores.slice(*keys).values.map(&:to_i).reduce(:+) || 0} / #{keys.length * 5}"
      end

      all_score_hash
    end
  end
end
