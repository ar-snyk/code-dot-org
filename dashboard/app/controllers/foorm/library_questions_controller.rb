module Foorm
  # Foorm Library Editor is only available on levelbuilder or test, for those with levelbuilder permissions.
  class LibraryQuestionsController < ApplicationController
    before_action :require_levelbuilder_mode_or_test_env
    before_action :authenticate_user!
    load_and_authorize_resource

    # POST /foorm/library_questions
    def create
      puts params
      puts params[:library_name]
      library = Foorm::Library.find_by(id: params[:library_id])
      if library.nil?
        library = Foorm::Library.create(
          {
            name: params[:library_name],
            version: 0,
            published: true
          }
        )
      end

      @library_question.assign_attributes(
        {
          library_name: library.nil? ? library.name : params[:library_name],
          library_version: library.nil? ? library.version : 0,
          question: JSON.pretty_generate(get_question),
          question_name: params[:name],
          published: true
        }
      )

      if @library_question.save
        return render json: @library_question
      else
        return render status: :bad_request, json: @library_question.errors
      end
    end

    # GET /foorm/library_questions/:id
    def show
      if @library_question
        data_to_return = {
          id: @library_question.id,
          name: @library_question.question_name,
          question: JSON.parse(@library_question.question),
          published: @library_question.published
        }
        render json: data_to_return
      else
        render json: {}
      end
    end

    # PUT /foorm/library_questions/:id/update
    def update
      @library_question.question = get_question

      if @library_question.save
        return render json: @library_question
      else
        return render status: :bad_request, json: @library_question.errors
      end
    end

    # GET /foorm/library_questions/:id/published_forms_appeared_in
    def published_forms_appeared_in
      published_forms = @library_question.published_forms_appeared_in
      data_to_return = published_forms.map(&:key)

      return render json: data_to_return
    end

    def get_question
      question_json = params[:question].as_json
      unless question_json
        return render(status: :bad_request, plain: "no question provided")
      end
      question_json
    end
  end
end
